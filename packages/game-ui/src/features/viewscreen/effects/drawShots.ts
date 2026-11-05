import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { ShotEffect } from 'common-data/features/space/types/WeaponEffect';
import { WeaponVisual, getDeflectorParts } from 'common-ui/features/spacemap/utils/weaponVisuals';
import { glow, line, seededRandom } from './light';
import { ShotAim, getEffectSeed, getProjectilePoint } from './shotPaths';

/** Draw a beam: a burning line of light, with bright knots of energy running down it. */
export function drawBeam(ctx: CanvasRenderingContext2D, shot: ShotEffect, visual: WeaponVisual, aim: ShotAim, time: number) {
    const elapsed = time - shot.startTime;
    const progress = elapsed / visual.duration;
    const envelope = progress < 0.06 ? progress / 0.06 : progress > 0.55 ? 1 - (progress - 0.55) / 0.45 : 1;
    const flicker = 0.88 + 0.12 * Math.sin(time * 0.11 + getEffectSeed(shot));
    const width = visual.thickness * visual.brightness * envelope * flicker;

    ctx.lineCap = 'round';
    line(ctx, aim.startX, aim.startY, aim.endX, aim.endY, width * 3.2, visual.color, 0.22);
    line(ctx, aim.startX, aim.startY, aim.endX, aim.endY, width * 1.3, visual.color, 0.9);
    line(ctx, aim.startX, aim.startY, aim.endX, aim.endY, width * 0.45, '#ffffff', 0.95);

    const span = Math.hypot(aim.endX - aim.startX, aim.endY - aim.startY) || 1;
    for (let i = 0; i < 4; i++) {
        const along = ((elapsed * 0.012 + i * 2.7) % span) / span;
        glow(ctx, aim.startX + (aim.endX - aim.startX) * along, aim.startY + (aim.endY - aim.startY) * along, width * 2.4, visual.color, envelope * 0.7);
    }

    glow(ctx, aim.startX, aim.startY, 0.5 + width * 2, visual.color, envelope);
    glow(ctx, aim.startX, aim.startY, 0.2 + width, '#ffffff', envelope);

    if (!shot.missed) {
        glow(ctx, aim.endX, aim.endY, 0.4 + width * 2, visual.color, envelope * 0.9);
    }
}

/** Draw a projectile: a bright point with a fading trail. One that misses burns out some way past its target. */
export function drawProjectile(ctx: CanvasRenderingContext2D, shot: ShotEffect, visual: WeaponVisual, aim: ShotAim, launch: Vector2D, time: number) {
    const elapsed = time - shot.startTime;
    const { duration, color } = visual;
    const missed = !!shot.missed;

    if (elapsed < 200) {
        glow(ctx, launch.x, launch.y, 0.9, color, 1 - elapsed / 200);
    }

    if (elapsed > duration) {
        const after = elapsed - duration;

        if (missed && after < 350) {
            const end = getProjectilePoint(aim, launch, 1, true);
            glow(ctx, end.x, end.y, 0.6 + after * 0.003, color, 1 - after / 350);
            glow(ctx, end.x, end.y, 0.3, '#ffffff', 1 - after / 200);
        }

        return;
    }

    for (let i = 14; i >= 1; i--) {
        const trailElapsed = elapsed - i * 34;

        if (trailElapsed >= 0) {
            const point = getProjectilePoint(aim, launch, trailElapsed / duration, missed);
            const fade = 1 - i / 15;
            glow(ctx, point.x, point.y, 0.34 * fade + 0.05, color, fade * 0.55);
        }
    }

    const head = getProjectilePoint(aim, launch, elapsed / duration, missed);
    const pulse = 0.85 + 0.15 * Math.sin(time * 0.04 + getEffectSeed(shot));
    glow(ctx, head.x, head.y, 0.8 * pulse, color, 0.9);
    glow(ctx, head.x, head.y, 0.32, '#ffffff', 1);

    const flare = 0.75 * pulse;
    line(ctx, head.x - flare, head.y, head.x + flare, head.y, 0.03, '#ffffff', 0.8);
    line(ctx, head.x, head.y - flare * 0.6, head.x, head.y + flare * 0.6, 0.03, '#ffffff', 0.5);
}

/**
 * Draw a deflector effect. A card's name says how it looks: its delivery sets the shape, its substance sets the color,
 * and its modifier sets the texture. So phased effects flicker in bands, modulated ones weave, inverted ones run backwards
 * from their target and beams with that are hollow, and coherent ones are clean and steady.
 */
export function drawDeflector(ctx: CanvasRenderingContext2D, shot: ShotEffect, visual: WeaponVisual, aim: ShotAim, time: number) {
    const parts = getDeflectorParts(shot.weapon);

    if (!parts) {
        return;
    }

    const elapsed = time - shot.startTime;
    const progress = elapsed / visual.duration;
    const envelope = Math.min(1, progress / 0.1) * Math.min(1, (1 - progress) / 0.35);
    const { color } = visual;
    const thickness = visual.thickness * 1.6;

    const isInverted = parts.modifier === 'Inverted';
    const isModulated = parts.modifier === 'Modulated';
    const flow = isInverted ? -1 : 1;

    /** How strongly to draw a point part-way along the delivery. */
    const texture = (along: number) => {
        if (parts.modifier === 'Phased') {
            return (((along * 7 - flow * elapsed * 0.007) % 1) + 1) % 1 < 0.5 ? 1 : 0.1;
        }

        return isInverted ? 0.45 + 0.55 * Math.abs(Math.sin(along * 14 - flow * elapsed * 0.012)) : 1;
    };

    const pointAt = (along: number) => {
        const wobble = isModulated ? Math.sin(along * 22 - elapsed * 0.018) * 0.22 : 0;

        return {
            x: aim.startX + (aim.endX - aim.startX) * along - aim.dy * wobble,
            y: aim.startY + (aim.endY - aim.startY) * along + aim.dx * wobble,
        };
    };

    const stroke = (from: number, to: number, alpha: number, offset = 0) => {
        const a = pointAt(from);
        const b = pointAt(to);
        const offsetX = -aim.dy * offset;
        const offsetY = aim.dx * offset;

        line(ctx, a.x + offsetX, a.y + offsetY, b.x + offsetX, b.y + offsetY, thickness * 2.4, color, alpha * 0.3);
        line(ctx, a.x + offsetX, a.y + offsetY, b.x + offsetX, b.y + offsetY, thickness, color, alpha);
        line(ctx, a.x + offsetX, a.y + offsetY, b.x + offsetX, b.y + offsetY, thickness * 0.35, '#ffffff', alpha * 0.8);
    };

    ctx.lineCap = 'round';

    switch (parts.delivery) {
        case 'Beam': {
            const steps = 48;

            for (let i = 0; i < steps; i++) {
                const along = i / steps;
                const next = (i + 1) / steps;
                const alpha = envelope * texture(along);

                if (isInverted) {
                    stroke(along, next, alpha, 0.13);
                    stroke(along, next, alpha, -0.13);
                } else {
                    stroke(along, next, alpha);
                }
            }
            break;
        }
        case 'Pulse': {
            for (let bolt = 0; bolt < 4; bolt++) {
                const raw = progress * 1.6 - bolt * 0.14;

                if (raw >= 0 && raw <= 1) {
                    const along = isInverted ? 1 - raw : raw;
                    const length = 0.09;
                    stroke(Math.max(0, along - length), Math.min(1, along + length), texture(raw));
                }
            }
            break;
        }
        case 'Burst': {
            const random = seededRandom(getEffectSeed(shot));
            const direction = Math.atan2(aim.dy, aim.dx);

            for (let shard = 0; shard < 22; shard++) {
                const angle = direction + (random() - 0.5) * 0.5;
                const delay = random() * 0.3;
                const speed = 0.8 + random() * 0.5;
                const raw = (progress - delay) * 1.8 * speed;

                if (raw >= 0 && raw <= 1) {
                    const reach = aim.distance * (isInverted ? 1 - raw : raw);
                    const x = aim.startX + Math.cos(angle) * reach;
                    const y = aim.startY + Math.sin(angle) * reach;
                    const size = 0.45 * texture(raw);
                    const tailX = x - Math.cos(angle) * size * flow;
                    const tailY = y - Math.sin(angle) * size * flow;

                    line(ctx, x, y, tailX, tailY, thickness * 2, color, 0.3);
                    line(ctx, x, y, tailX, tailY, thickness, color, 1);
                }
            }
            break;
        }
        default: {
            // A field wraps around its target, after a brief thread back to its source.
            if (progress < 0.25) {
                stroke(0, 1, envelope * (1 - progress / 0.25) * 0.5);
            }

            for (let ring = 0; ring < 3; ring++) {
                const phase = (progress * 2.2 + ring / 3) % 1;
                const radius = isInverted ? 0.7 + phase * 1.4 : 2.1 - phase * 1.4;

                ctx.beginPath();
                for (let i = 0; i <= 48; i++) {
                    const angle = i / 48 * Math.PI * 2;
                    const wave = isModulated ? Math.sin(angle * 6 + elapsed * 0.01) * 0.1 : 0;
                    const x = aim.target.x + Math.cos(angle) * (radius + wave);
                    const y = aim.target.y + Math.sin(angle) * (radius + wave);

                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }

                ctx.strokeStyle = color;
                ctx.lineWidth = thickness * 0.8;
                ctx.globalAlpha = envelope * (1 - Math.abs(phase - 0.5)) * texture(ring / 3);
                ctx.stroke();
            }

            glow(ctx, aim.target.x, aim.target.y, 2.6, color, envelope * 0.35);
            break;
        }
    }
}

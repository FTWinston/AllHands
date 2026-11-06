import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { ImpactEffect } from 'common-data/features/space/types/WeaponEffect';
import { glow, line, seededRandom } from './light';
import { getEffectSeed, shieldRadius } from './shotPaths';

const shieldColor = '#6fd8ff';

/** How long a hit's fire keeps burning on a ship's hull, in milliseconds. */
export const hullFireDuration = 2800;

const shieldHitDuration = 800;
const hexRadius = 0.125;
const hexSpacing = 0.27;

/** Light up a ship's shield around where it was hit, as a wave of hexagonal cells running around it from there. */
export function drawShieldHit(ctx: CanvasRenderingContext2D, target: Vector2D, contactAngle: number, dt: number) {
    if (dt < 0 || dt > shieldHitDuration) {
        return;
    }

    const fade = 1 - dt / shieldHitDuration;
    const front = 0.2 + (dt / shieldHitDuration) * 1.6;

    ctx.strokeStyle = shieldColor;
    ctx.lineWidth = 0.028;

    for (let row = 0; row < 3; row++) {
        const radius = shieldRadius - row * 0.21;
        const count = Math.round(radius * 2 * Math.PI / hexSpacing);

        for (let i = 0; i < count; i++) {
            const angle = (i + (row % 2) * 0.5) / count * Math.PI * 2;
            const offset = Math.abs(Math.atan2(Math.sin(angle - contactAngle), Math.cos(angle - contactAngle)));
            const strength = Math.exp(-Math.pow((offset - front * 0.75) / 0.35, 2)) + Math.exp(-Math.pow(offset / 0.4, 2)) * fade;
            const alpha = strength * fade * (1 - row * 0.3);

            if (alpha < 0.03) {
                continue;
            }

            const x = target.x + Math.cos(angle) * radius;
            const y = target.y + Math.sin(angle) * radius;

            ctx.globalAlpha = Math.min(1, alpha);
            ctx.beginPath();
            for (let corner = 0; corner <= 6; corner++) {
                const cornerAngle = corner * Math.PI / 3 + angle;
                const cornerX = x + Math.cos(cornerAngle) * hexRadius;
                const cornerY = y + Math.sin(cornerAngle) * hexRadius;

                if (corner === 0) {
                    ctx.moveTo(cornerX, cornerY);
                } else {
                    ctx.lineTo(cornerX, cornerY);
                }
            }
            ctx.stroke();
        }
    }

    // A faint glimpse of the whole bubble.
    ctx.globalAlpha = fade * 0.3;
    ctx.lineWidth = 0.03;
    ctx.beginPath();
    ctx.arc(target.x, target.y, shieldRadius, 0, Math.PI * 2);
    ctx.stroke();

    const contactX = target.x + Math.cos(contactAngle) * shieldRadius;
    const contactY = target.y + Math.sin(contactAngle) * shieldRadius;
    glow(ctx, contactX, contactY, 1.05 * fade + 0.2, shieldColor, fade);
    glow(ctx, contactX, contactY, 0.35, '#ffffff', fade * fade);
}

/** Draw sparks flying out from a point, slowing as they go. */
export function drawSparks(ctx: CanvasRenderingContext2D, x: number, y: number, direction: number, spread: number, count: number, speed: number, dt: number, duration: number, seed: number) {
    const random = seededRandom(seed);
    const seconds = dt / 1000;
    const drag = 3;

    for (let i = 0; i < count; i++) {
        const angle = direction + (random() - 0.5) * spread;
        const sparkSpeed = speed * (0.35 + random());
        const sparkDuration = duration * (0.5 + random() * 0.5);

        if (dt > sparkDuration) {
            continue;
        }

        const travel = sparkSpeed * (1 - Math.exp(-seconds * drag)) / drag;
        const tail = sparkSpeed * Math.exp(-seconds * drag) * 0.035;
        const sparkX = x + Math.cos(angle) * travel;
        const sparkY = y + Math.sin(angle) * travel;
        const fade = 1 - dt / sparkDuration;

        line(ctx, sparkX, sparkY, sparkX - Math.cos(angle) * tail, sparkY - Math.sin(angle) * tail, 0.035, fade > 0.5 ? '#ffe9b0' : '#ff8a3a', fade);
    }
}

/** Draw damage getting through to a ship: a burst of fire and sparks, then a fire that burns on its hull for a while. */
export function drawHullHit(ctx: CanvasRenderingContext2D, impact: ImpactEffect, target: Vector2D, isTargetPresent: boolean, contactAngle: number, dt: number) {
    if (dt < 0) {
        return;
    }

    const seed = getEffectSeed(impact);
    const offsetX = Math.cos(contactAngle) * 0.55;
    const offsetY = Math.sin(contactAngle) * 0.55;
    const x = target.x + offsetX;
    const y = target.y + offsetY;

    if (dt < 320) {
        const fade = 1 - dt / 320;
        glow(ctx, x, y, 0.5 + dt * 0.003, '#ffb35a', fade);
        glow(ctx, x, y, 0.4, '#ffffff', fade * fade);
    }

    if (dt < 800) {
        drawSparks(ctx, x, y, contactAngle, 2.2, 24, 9, dt, 800, seed);
    }

    if (dt < hullFireDuration && isTargetPresent) {
        const fade = 1 - dt / hullFireDuration;
        const random = seededRandom(seed + 1);

        for (let i = 0; i < 3; i++) {
            const emberX = x + (random() - 0.5) * 0.5 - offsetX * 0.3;
            const emberY = y + (random() - 0.5) * 0.5 - offsetY * 0.3;
            const flicker = 0.6 + 0.4 * Math.sin(dt * (0.02 + random() * 0.03) + i);
            glow(ctx, emberX, emberY, 0.22, '#ff7a1a', fade * flicker);
        }
    }
}

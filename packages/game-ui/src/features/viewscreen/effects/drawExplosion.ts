import { ExplosionEffect } from 'common-data/features/space/types/WeaponEffect';
import { getSvgBitmap } from 'common-ui/features/spacemap/utils/svgBitmapCache';
import { getBlastSize } from './blastSize';
import { drawSparks } from './drawImpacts';
import { glow, seededRandom } from './light';
import { wreckColors } from './objectTracker';
import { getEffectSeed } from './shotPaths';

/** How long a wreck takes to fade away, in milliseconds. */
export const wreckDuration = 5200;

const fireColors = ['#fff1c9', '#ffc861', '#ff7f24', '#c23a0e', '#5a1a0a'];

/** Break a ship's own drawing into scorched wedges that drift apart and spin. */
export function drawWreck(ctx: CanvasRenderingContext2D, explosion: ExplosionEffect, dt: number) {
    if (dt < 0 || dt > wreckDuration) {
        return;
    }

    const bitmap = getSvgBitmap(explosion.appearance, wreckColors[0], wreckColors[1]);
    if (!bitmap) {
        return;
    }

    const { position } = explosion;
    const blast = getBlastSize(explosion.appearance);
    const random = seededRandom(getEffectSeed(explosion));
    const count = Math.round(5 + blast * 2);
    const spread = 1.6 + blast * 0.5;
    const seconds = dt / 1000;
    const drift = (1 - Math.exp(-seconds * 1.4)) / 1.4;

    let startAngle = random() * Math.PI * 2;

    for (let i = 0; i < count; i++) {
        const sweep = (Math.PI * 2 / count) * (0.7 + random() * 0.6);
        const endAngle = startAngle + sweep;
        const middle = startAngle + sweep / 2;
        const speed = spread * (0.5 + random());
        const spin = (random() - 0.5) * 3;
        const fadeStart = wreckDuration * (0.4 + random() * 0.3);

        ctx.save();
        ctx.globalAlpha = dt < fadeStart ? 1 : Math.max(0, 1 - (dt - fadeStart) / (wreckDuration - fadeStart));
        ctx.translate(position.x + Math.cos(middle) * speed * drift, position.y + Math.sin(middle) * speed * drift);
        ctx.rotate(spin * drift);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 1.5, startAngle, endAngle);
        ctx.closePath();
        ctx.clip();
        ctx.rotate(-position.angle);
        ctx.drawImage(bitmap, -1, -1, 2, 2);
        ctx.restore();

        startAngle = endAngle;
    }
}

/**
 * Draw the light of an explosion: a white flash (unless flashes are to be avoided), balls of fire that cool as they
 * burst outward, a shockwave, and sparks. Bigger ships keep going off for longer.
 */
export function drawExplosion(ctx: CanvasRenderingContext2D, explosion: ExplosionEffect, dt: number, allowFlash: boolean) {
    const blast = getBlastSize(explosion.appearance);

    if (dt < 0 || dt > 3000 * Math.sqrt(blast)) {
        return;
    }

    const { x, y } = explosion.position;
    const seed = getEffectSeed(explosion);
    const random = seededRandom(seed);

    if (allowFlash && dt < 220) {
        glow(ctx, x, y, Math.sqrt(blast) * (1.8 + dt * 0.01), '#ffffff', (1 - dt / 220) * 0.9);
    }

    const count = Math.round(9 * blast);
    for (let i = 0; i < count; i++) {
        const angle = random() * Math.PI * 2;
        const distance = (0.25 + random() * 0.95) * blast;
        const delay = random() * 280 * blast;
        const duration = (500 + random() * 700) * Math.sqrt(blast);
        const size = (0.45 + random() * 0.75) * Math.sqrt(blast);
        const age = dt - delay;

        if (age >= 0 && age <= duration) {
            const progress = age / duration;
            const out = 1 - Math.pow(1 - progress, 3);
            const color = fireColors[Math.min(fireColors.length - 1, Math.floor(progress * fireColors.length))];

            // Additive light adds up quickly, so each of these must be faint, or all the fire just saturates to white.
            glow(ctx, x + Math.cos(angle) * distance * out, y + Math.sin(angle) * distance * out, size * (0.5 + out), color, (1 - progress) * 0.5);
        }
    }

    const waveDuration = 1000 * Math.sqrt(blast);
    if (dt < waveDuration) {
        const progress = dt / waveDuration;
        const radius = blast * 4.2 * (1 - Math.pow(1 - progress, 2.2));
        const fade = 1 - progress;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffd9a8';
        ctx.lineWidth = 0.14 * fade + 0.02;
        ctx.globalAlpha = fade * 0.85;
        ctx.stroke();
        ctx.strokeStyle = '#ff9a55';
        ctx.lineWidth = 0.42 * fade;
        ctx.globalAlpha = fade * 0.22;
        ctx.stroke();
    }

    drawSparks(ctx, x, y, 0, Math.PI * 2, Math.round(30 * blast), 13 * Math.sqrt(blast), dt, 1100 * Math.sqrt(blast), seed + 2);
}

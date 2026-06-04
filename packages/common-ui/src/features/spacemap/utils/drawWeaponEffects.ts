import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { WeaponEffect } from 'common-data/features/space/types/WeaponEffect';
import { interpolatePosition } from 'common-data/features/space/utils/interpolate';

/** Default forward projection distance for untargeted beam effects, in world units. */
const BEAM_FORWARD_DISTANCE = 5;
/** Default forward projection distance for untargeted projectile effects, in world units. */
const PROJECTILE_FORWARD_DISTANCE = 15;
/** Fraction of projectile travel to show as a trail behind the projectile. */
const PROJECTILE_TRAIL_LENGTH = 0.06;

/**
 * Remove expired effects from the array in place.
 */
function pruneEffects(effects: WeaponEffect[], currentTime: number): void {
    for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i];
        if (currentTime > effect.startTime + effect.duration) {
            effects.splice(i, 1);
        }
    }
}

/**
 * Get the progress of an effect (0 = just started, 1 = about to end).
 */
function getProgress(effect: WeaponEffect, currentTime: number): number {
    const elapsed = currentTime - effect.startTime;
    return Math.max(0, Math.min(1, elapsed / effect.duration));
}

/**
 * Calculate the forward-projected position for an untargeted effect.
 * Projects a fixed distance ahead of the source object in its facing direction.
 */
function getForwardPosition(sourcePos: { x: number; y: number; angle: number }, distance: number) {
    return {
        x: sourcePos.x + Math.cos(sourcePos.angle) * distance,
        y: sourcePos.y - Math.sin(sourcePos.angle) * distance,
    };
}

/**
 * Draw a beam effect — a line from source to target that fades in then out.
 */
function drawBeam(
    ctx: CanvasRenderingContext2D,
    effect: WeaponEffect,
    objects: Record<string, GameObjectInfo>,
    currentTime: number,
    pixelSize: number,
    minimal: boolean
) {
    const source = objects[effect.sourceId];
    if (!source) return;

    const sourcePos = interpolatePosition(source.motion, currentTime);

    let targetX: number, targetY: number;
    if (effect.targetId && objects[effect.targetId]) {
        const targetPos = interpolatePosition(objects[effect.targetId].motion, currentTime);
        targetX = targetPos.x;
        targetY = targetPos.y;
    } else {
        const forward = getForwardPosition(sourcePos, BEAM_FORWARD_DISTANCE);
        targetX = forward.x;
        targetY = forward.y;
    }

    const progress = getProgress(effect, currentTime);

    // Fade: ramp up in the first 20%, hold, ramp down in last 30%
    let alpha: number;
    if (progress < 0.2) {
        alpha = progress / 0.2;
    } else if (progress > 0.7) {
        alpha = 1 - (progress - 0.7) / 0.3;
    } else {
        alpha = 1;
    }

    const lineWidth = effect.thickness;
    const brightness = effect.brightness ?? 1;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (minimal) {
        // Minimal mode: simple white line, no glow
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = Math.max(lineWidth * 0.5, pixelSize * 2);
        ctx.beginPath();
        ctx.moveTo(sourcePos.x, sourcePos.y);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
    } else {
        // Full mode: glow effect + colored beam
        // Outer glow
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = lineWidth * 2 * brightness;
        ctx.globalAlpha = alpha * 0.3;
        ctx.beginPath();
        ctx.moveTo(sourcePos.x, sourcePos.y);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();

        // Core beam
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = lineWidth;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(sourcePos.x, sourcePos.y);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();

        // Bright center
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = lineWidth * 0.4;
        ctx.globalAlpha = alpha * 0.6;
        ctx.beginPath();
        ctx.moveTo(sourcePos.x, sourcePos.y);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
    }

    ctx.restore();
}

/**
 * Draw a projectile effect — a moving dot from source to target.
 */
function drawProjectile(
    ctx: CanvasRenderingContext2D,
    effect: WeaponEffect,
    objects: Record<string, GameObjectInfo>,
    currentTime: number,
    pixelSize: number,
    minimal: boolean
) {
    const source = objects[effect.sourceId];
    if (!source) return;

    const sourcePos = interpolatePosition(source.motion, currentTime);

    let targetX: number, targetY: number;
    if (effect.targetId && objects[effect.targetId]) {
        const targetPos = interpolatePosition(objects[effect.targetId].motion, currentTime);
        targetX = targetPos.x;
        targetY = targetPos.y;
    } else {
        const forward = getForwardPosition(sourcePos, PROJECTILE_FORWARD_DISTANCE);
        targetX = forward.x;
        targetY = forward.y;
    }

    const progress = getProgress(effect, currentTime);

    // Projectile travels from source to target
    const x = sourcePos.x + (targetX - sourcePos.x) * progress;
    const y = sourcePos.y + (targetY - sourcePos.y) * progress;
    const radius = effect.thickness;

    ctx.save();

    if (minimal) {
        // Minimal: small white dot
        ctx.fillStyle = '#cccccc';
        ctx.beginPath();
        ctx.arc(x, y, Math.max(radius * 0.5, pixelSize * 3), 0, Math.PI * 2);
        ctx.fill();
    } else {
        const brightness = effect.brightness ?? 1;

        // Outer glow
        ctx.fillStyle = effect.color;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(x, y, radius * 2 * brightness, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = effect.color;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Bright center
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Trail
        const trailStartProgress = Math.max(0, progress - PROJECTILE_TRAIL_LENGTH);
        const trailStartX = sourcePos.x + (targetX - sourcePos.x) * trailStartProgress;
        const trailStartY = sourcePos.y + (targetY - sourcePos.y) * trailStartProgress;

        ctx.strokeStyle = effect.color;
        ctx.lineWidth = radius * 0.6;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(trailStartX, trailStartY);
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    ctx.restore();
}

/**
 * Draw an explosion effect — expanding and fading ring/burst at source position.
 */
function drawExplosion(
    ctx: CanvasRenderingContext2D,
    effect: WeaponEffect,
    objects: Record<string, GameObjectInfo>,
    currentTime: number,
    pixelSize: number,
    minimal: boolean
) {
    // For explosions, use startTime position since the object may have been removed
    const source = objects[effect.sourceId];
    let x: number, y: number;
    if (source) {
        const pos = interpolatePosition(source.motion, currentTime);
        x = pos.x;
        y = pos.y;
    } else {
        // Object was removed (destroyed). Use a fallback — try to use the position from the effect start.
        // Since we can't interpolate a removed object, we accept that the explosion might not render
        // if the object is already gone. The destroy() method broadcasts the effect before removal,
        // so the first frame should still find the object.
        return;
    }

    const progress = getProgress(effect, currentTime);
    const maxRadius = effect.thickness * 3;
    const radius = maxRadius * progress;

    // Fade out over the duration
    const alpha = 1 - progress;

    ctx.save();

    if (minimal) {
        // Minimal: expanding white ring
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = Math.max(pixelSize * 2, 0.05);
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
    } else {
        const brightness = effect.brightness ?? 1;

        // Outer glow
        ctx.fillStyle = effect.color;
        ctx.globalAlpha = alpha * 0.2;
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.5 * brightness, 0, Math.PI * 2);
        ctx.fill();

        // Main fill
        ctx.fillStyle = effect.color;
        ctx.globalAlpha = alpha * 0.5;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Bright ring
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = effect.thickness * 0.3;
        ctx.globalAlpha = alpha * 0.7;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.8, 0, Math.PI * 2);
        ctx.stroke();

        // Inner bright core (fades faster)
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = alpha * alpha * 0.6;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

/**
 * Draw all active weapon effects onto the canvas.
 * Call this as a `drawExtraForeground` callback on SpaceMap.
 *
 * @param ctx - Canvas context, already in world coordinates
 * @param effects - Mutable array of active effects (expired ones will be pruned)
 * @param objects - Current game objects for position lookups
 * @param currentTime - Current server time
 * @param pixelSize - Size of one pixel in world units
 * @param minimal - If true, draw simplified effects without color or glow (for helm)
 */
export function drawWeaponEffects(
    ctx: CanvasRenderingContext2D,
    effects: WeaponEffect[],
    objects: Record<string, GameObjectInfo>,
    currentTime: number,
    pixelSize: number,
    minimal: boolean
) {
    pruneEffects(effects, currentTime);

    for (const effect of effects) {
        switch (effect.type) {
            case 'beam':
                drawBeam(ctx, effect, objects, currentTime, pixelSize, minimal);
                break;
            case 'projectile':
                drawProjectile(ctx, effect, objects, currentTime, pixelSize, minimal);
                break;
            case 'explosion':
                drawExplosion(ctx, effect, objects, currentTime, pixelSize, minimal);
                break;
        }
    }
}

import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { Position } from 'common-data/features/space/types/Position';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { ExplosionEffect, ShotEffect, WeaponEffect } from 'common-data/features/space/types/WeaponEffect';
import { interpolatePosition } from 'common-data/features/space/utils/interpolate';
import { getWeaponVisual } from './weaponVisuals';

/** Default forward projection distance for untargeted beam effects, in world units. */
const BEAM_FORWARD_DISTANCE = 5;
/** Default forward projection distance for untargeted projectile effects, in world units. */
const PROJECTILE_FORWARD_DISTANCE = 15;

const EXPLOSION_DURATION = 1500;
const EXPLOSION_RADIUS = 1.5;

const COLOR = '#cccccc';

function getProgress(startTime: number, duration: number, currentTime: number): number {
    return Math.max(0, Math.min(1, (currentTime - startTime) / duration));
}

function getTargetPoint(effect: ShotEffect, objects: Record<string, GameObjectInfo>, sourcePos: Position, currentTime: number, forwardDistance: number): Vector2D {
    const target = effect.targetId ? objects[effect.targetId] : undefined;

    if (target) {
        return interpolatePosition(target.motion, currentTime);
    }

    return effect.targetPosition ?? {
        x: sourcePos.x + Math.cos(sourcePos.angle) * forwardDistance,
        y: sourcePos.y - Math.sin(sourcePos.angle) * forwardDistance,
    };
}

/** Draw a beam, or a deflector: a simple line from source to target that fades in then out. */
function drawBeam(ctx: CanvasRenderingContext2D, effect: ShotEffect, duration: number, thickness: number, objects: Record<string, GameObjectInfo>, currentTime: number, pixelSize: number) {
    const source = objects[effect.sourceId];
    if (!source) {
        return;
    }

    const sourcePos = interpolatePosition(source.motion, currentTime);
    const target = getTargetPoint(effect, objects, sourcePos, currentTime, BEAM_FORWARD_DISTANCE);
    const progress = getProgress(effect.startTime, duration, currentTime);

    // Fade: ramp up in the first 20%, hold, ramp down in last 30%
    ctx.globalAlpha = progress < 0.2 ? progress / 0.2 : progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = Math.max(thickness * 0.5, pixelSize * 2);
    ctx.beginPath();
    ctx.moveTo(sourcePos.x, sourcePos.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
}

/** Draw a projectile: a small dot moving from source to target. */
function drawProjectile(ctx: CanvasRenderingContext2D, effect: ShotEffect, duration: number, thickness: number, objects: Record<string, GameObjectInfo>, currentTime: number, pixelSize: number) {
    const source = objects[effect.sourceId];
    if (!source) {
        return;
    }

    const sourcePos = interpolatePosition(source.motion, currentTime);
    const target = getTargetPoint(effect, objects, sourcePos, currentTime, PROJECTILE_FORWARD_DISTANCE);
    const progress = getProgress(effect.startTime, duration, currentTime);

    ctx.fillStyle = COLOR;
    ctx.beginPath();
    ctx.arc(
        sourcePos.x + (target.x - sourcePos.x) * progress,
        sourcePos.y + (target.y - sourcePos.y) * progress,
        Math.max(thickness * 0.5, pixelSize * 3),
        0,
        Math.PI * 2
    );
    ctx.fill();
}

/** Draw an explosion: an expanding ring that fades away. */
function drawExplosion(ctx: CanvasRenderingContext2D, effect: ExplosionEffect, currentTime: number, pixelSize: number) {
    const progress = getProgress(effect.startTime, EXPLOSION_DURATION, currentTime);

    ctx.globalAlpha = 1 - progress;
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = Math.max(pixelSize * 2, 0.05);
    ctx.beginPath();
    ctx.arc(effect.position.x, effect.position.y, EXPLOSION_RADIUS * progress, 0, Math.PI * 2);
    ctx.stroke();
}

function getDuration(effect: WeaponEffect) {
    switch (effect.type) {
        case 'shot':
            return getWeaponVisual(effect.weapon).duration;
        case 'explosion':
            return EXPLOSION_DURATION;
        default:
            return 0;
    }
}

/**
 * Draw simplified versions of all active weapon effects onto the canvas, without color or glow. Also prunes expired effects.
 * Call this as a `drawExtraForeground` callback on SpaceMap.
 *
 * @param ctx - Canvas context, already in world coordinates
 * @param effects - Mutable array of active effects (expired ones will be pruned)
 * @param objects - Current game objects for position lookups
 * @param currentTime - Current server time
 * @param pixelSize - Size of one pixel in world units
 */
export function drawWeaponEffects(
    ctx: CanvasRenderingContext2D,
    effects: WeaponEffect[],
    objects: Record<string, GameObjectInfo>,
    currentTime: number,
    pixelSize: number
) {
    ctx.save();

    for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i];

        if (currentTime > effect.startTime + getDuration(effect)) {
            effects.splice(i, 1);
            continue;
        }

        ctx.globalAlpha = 1;

        if (effect.type === 'explosion') {
            drawExplosion(ctx, effect, currentTime, pixelSize);
        } else if (effect.type === 'shot') {
            const { kind, duration, thickness } = getWeaponVisual(effect.weapon);

            if (kind === 'projectile') {
                drawProjectile(ctx, effect, duration, thickness, objects, currentTime, pixelSize);
            } else {
                drawBeam(ctx, effect, duration, thickness, objects, currentTime, pixelSize);
            }
        }
    }

    ctx.restore();
}

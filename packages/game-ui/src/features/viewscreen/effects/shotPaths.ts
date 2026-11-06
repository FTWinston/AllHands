import { Position } from 'common-data/features/space/types/Position';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { ImpactEffect, ShotEffect, WeaponEffect } from 'common-data/features/space/types/WeaponEffect';

/** How far a ship's shields extend from its center, in world units. Ships are all drawn the same size. */
export const shieldRadius = 1.35;

/** How far from a ship's center a shot stops, when it's reached the hull. */
const hullRadius = 0.55;

/** How far from a ship's center a shot starts. */
const muzzleDistance = 0.8;

/** How far off target a shot that misses goes. */
const missOffset = 1.7;

/** How far past its target a beam that misses carries on. */
const missedBeamOvershoot = 14;

/** How far past its target a projectile that misses carries on, before burning out. */
const missedProjectileOvershoot = 4;

/** How far an untargeted shot goes. */
const untargetedDistance = 15;

export type ShotAim = {
    source: Vector2D;
    target: Vector2D;
    /** How far apart the source and target are. */
    distance: number;
    /** The direction the shot is going in, as a unit vector. */
    dx: number;
    dy: number;
    /** Which way this shot curves or misses by: 1 or -1. */
    side: 1 | -1;
    startX: number;
    startY: number;
    /** Where the shot visibly ends. */
    endX: number;
    endY: number;
};

/** A number that's different for each effect, to seed its random details. */
export function getEffectSeed(effect: WeaponEffect) {
    let hash = Math.floor(effect.startTime);

    for (let i = 0; i < effect.sourceId.length; i++) {
        hash = Math.imul(hash ^ effect.sourceId.charCodeAt(i), 31);
    }

    return hash >>> 0;
}

/** The impact from this shot, if it's a beam and it's landed: those land the moment they're fired. */
export function findBeamImpact(shot: ShotEffect, effects: readonly WeaponEffect[]): ImpactEffect | undefined {
    return effects.find((effect): effect is ImpactEffect => effect.type === 'impact'
        && effect.sourceId === shot.sourceId
        && effect.targetId === shot.targetId
        && effect.startTime === shot.startTime);
}

/**
 * Work out where a shot is going, given where its source and target currently are.
 * If the shot has landed and got through the shields, it goes all the way to the hull. Otherwise it stops at the shields.
 */
export function getShotAim(shot: ShotEffect, source: Position, target: Vector2D | undefined, impact?: ImpactEffect): ShotAim {
    const side = getEffectSeed(shot) % 2 ? 1 : -1;

    const targetPoint = target ?? {
        x: source.x + Math.cos(source.angle) * untargetedDistance,
        y: source.y - Math.sin(source.angle) * untargetedDistance,
    };

    const offsetX = targetPoint.x - source.x;
    const offsetY = targetPoint.y - source.y;
    const distance = Math.hypot(offsetX, offsetY) || 1;

    let dx = offsetX / distance;
    let dy = offsetY / distance;
    let reach: number;

    if (shot.missed) {
        const aimX = offsetX - dy * side * missOffset;
        const aimY = offsetY + dx * side * missOffset;
        const aimLength = Math.hypot(aimX, aimY) || 1;
        dx = aimX / aimLength;
        dy = aimY / aimLength;
        reach = distance + missedBeamOvershoot;
    } else if (!target) {
        reach = distance;
    } else if (impact && impact.damage > 0) {
        reach = distance - hullRadius;
    } else {
        reach = distance - shieldRadius;
    }

    return {
        source,
        target: targetPoint,
        distance,
        dx,
        dy,
        side,
        startX: source.x + dx * muzzleDistance,
        startY: source.y + dy * muzzleDistance,
        endX: source.x + dx * reach,
        endY: source.y + dy * reach,
    };
}

/** Where a projectile is, on its slightly curved run from where it was launched. Progress goes from 0 to 1 over its flight. */
export function getProjectilePoint(aim: ShotAim, launch: Vector2D, progress: number, missed: boolean): Vector2D {
    const endX = missed ? aim.source.x + aim.dx * (aim.distance + missedProjectileOvershoot) : aim.target.x - aim.dx * shieldRadius;
    const endY = missed ? aim.source.y + aim.dy * (aim.distance + missedProjectileOvershoot) : aim.target.y - aim.dy * shieldRadius;

    const midX = (launch.x + endX) / 2 - aim.dy * aim.side * aim.distance * 0.16;
    const midY = (launch.y + endY) / 2 + aim.dx * aim.side * aim.distance * 0.16;

    const inverse = 1 - progress;

    return {
        x: inverse * inverse * launch.x + 2 * inverse * progress * midX + progress * progress * endX,
        y: inverse * inverse * launch.y + 2 * inverse * progress * midY + progress * progress * endY,
    };
}

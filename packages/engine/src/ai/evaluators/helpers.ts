import { ArraySchema } from '@colyseus/schema';
import { CardMotionSegmentFacing, LocationTargetCardDefinition } from 'common-data/features/cards/types/CardDefinition';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { Position } from 'common-data/features/space/types/Position';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { clampAngle, determineAngle, distance } from 'common-data/features/space/utils/vectors';
import { WeaponSlotState } from 'src/state/systems/tactical/WeaponSlotState';
import { ResolvedAiConfig } from '../types';
import type { Ship } from 'src/state/Ship';

/** 1 while range is inside the band, falling linearly to 0 at 3 band-widths outside it. */
export function rangeBandScore(range: number, band: { min: number; max: number }): number {
    const width = Math.max(1, band.max - band.min);
    const outside = range < band.min ? band.min - range : range > band.max ? range - band.max : 0;
    return Math.max(0, 1 - outside / (3 * width));
}

/** Where the ship will be when its current motion ends (the final keyframe). */
export function projectCurrentEndpoint(ship: Ship): Position {
    const last = ship.motion[ship.motion.length - 1];
    return { x: last.x, y: last.y, angle: last.angle };
}

/**
 * Approximate end state of playing a location card at the given location.
 * Ignores intermediate curve offsets; good enough for scoring. Null if distance limits forbid the play.
 */
export function estimateManeuverEndpoint(
    def: LocationTargetCardDefinition,
    from: Position,
    location: Vector2D
): Position | null {
    const dist = distance(from, location);
    if (def.minDistance !== undefined && dist < def.minDistance) {
        return null;
    }
    if (def.maxDistance !== undefined && dist > def.maxDistance) {
        return null;
    }

    let endAngle = from.angle;
    if (def.endFacing === CardMotionSegmentFacing.FinalVector) {
        endAngle = clampAngle(determineAngle(from, location) + (def.endFacingOffset ?? 0));
    } else if (def.startFacing === CardMotionSegmentFacing.FinalVector && def.baseSpeed === 0) {
        // Rotate-only card: it ends facing where startFacing pointed it.
        endAngle = clampAngle(determineAngle(from, location) + (def.startFacingOffset ?? 0));
    }

    if (def.baseSpeed === 0) {
        return { x: from.x, y: from.y, angle: endAngle };
    }
    return { x: location.x, y: location.y, angle: endAngle };
}

/** Range band the loaded weapons want, or null when no slot has a weapon. */
export function getDesiredRangeFromSlots(slots: ArraySchema<WeaponSlotState>): { min: number; max: number } | null {
    let min = 0;
    let max = Infinity;
    let any = false;
    for (const slot of slots) {
        if (!slot.card) {
            continue;
        }
        any = true;
        min = Math.max(min, slot.getParameter('minRange'));
        max = Math.min(max, slot.getParameter('maxRange'));
    }
    if (!any || max === Infinity) {
        // max === Infinity only happens if a loaded weapon's slot omits maxRange (all current
        // weapon definitions set it); Math.max leaves it as Infinity, so desiredRange.max would
        // propagate as Infinity into candidate-ring math (see helm.ts) if that ever changes.
        return any ? { min, max: Math.max(min + 1, max) } : null;
    }
    return { min, max };
}

export function priorityFor(system: ShipSystem, config: ResolvedAiConfig): number {
    if (system === 'hull' || system === 'reactor') {
        return 1;
    }
    return config.priorities[system];
}

/** Widest firing arc among loaded weapon slots, or null when nothing is loaded. */
export function bestWeaponArc(slots: ArraySchema<WeaponSlotState>): number | null {
    let best: number | null = null;
    for (const slot of slots) {
        if (!slot.card) {
            continue;
        }
        const arc = slot.getParameter('firingArc');
        if (best === null || arc > best) {
            best = arc;
        }
    }
    return best;
}

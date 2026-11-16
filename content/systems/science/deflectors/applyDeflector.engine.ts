import { crewRoleNames } from 'common-data/features/ships/types/CrewRole';
import { shipSystems } from 'common-data/features/ships/types/ShipSystem';
import { isLeveledSystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { CooldownState } from 'engine/state/CooldownState';
import { Ship } from 'engine/state/Ship';
import { deflectorBurstRadius, deflectorShieldDampening, getDeflectorOutcome, weakenDuration, weakenLevel, type DeflectorOutcome, type DeflectorParts } from './deflectorParts.shared';
import type { GameObject } from 'engine/state/GameObject';
import type { GameState } from 'engine/state/GameState';
import type { SystemState } from 'engine/state/systems/SystemState';

/**
 * Fire a deflector loaded with the given parts from a ship, at a target. Its substance says what effect it leaves, its delivery which ships
 * and systems it leaves it on, and how strongly, and its modifier twists that (see `getDeflectorOutcome`). Each hostile ship's shields then weaken it.
 * The deflector always fires, even if there's nothing for it to hit.
 */
export function applyDeflector(gameState: GameState, ship: Ship, target: GameObject | null, parts: DeflectorParts): boolean {
    const outcome = getDeflectorOutcome(parts);

    for (const affected of getAffectedShips(gameState, ship, target, outcome)) {
        const strength = outcome.weakenedByShields && affected !== ship ? getShieldStrength(affected) : 1;

        for (const system of getAffectedSystems(gameState, ship, affected, outcome)) {
            leaveEffect(gameState, system, outcome, strength);
        }
    }

    return true;
}

/** The ships a deflector hits: the one it was fired at (or, if friendly, the one firing it), or every hostile (or friendly) ship near the one firing it. */
export function getAffectedShips(gameState: GameState, ship: Ship, target: GameObject | null, outcome: DeflectorOutcome): Ship[] {
    if (outcome.ships === 'target') {
        if (outcome.friendly) {
            return [ship];
        }

        return target instanceof Ship ? [target] : [];
    }

    const registry = gameState.factionRegistry;
    const wanted = outcome.friendly ? RelationshipType.Friendly : RelationshipType.Hostile;
    const nearby = ship.shipsWithin(deflectorBurstRadius).filter(other => registry.getRelationship(ship, other) === wanted);

    return outcome.friendly ? [ship, ...nearby] : nearby;
}

/**
 * The systems of one ship that a deflector hits.
 * A deflector that hits one system hits the kind that science is scanning, if it's scanning the hit ship (or, if friendly, scanning anything), or else a random crew system.
 */
export function getAffectedSystems(gameState: GameState, ship: Ship, affected: Ship, outcome: DeflectorOutcome): SystemState[] {
    switch (outcome.systems) {
        case 'helm':
            return [affected.helmState];
        case 'all':
            return shipSystems.map(system => affected.getSystem(system));
        case 'one': {
            const scanned = ship.scienceState.getScannedSystemTarget();
            const system = scanned && (outcome.friendly || scanned.ship === affected)
                ? scanned.system
                : gameState.random.pick(crewRoleNames);
            return [affected.getSystem(system)];
        }
    }
}

/**
 * How strongly a deflector that shields weaken hits a ship: weakened by up to `deflectorShieldDampening`, in proportion to how full its shields are.
 */
export function getShieldStrength(affected: Ship): number {
    const { shield, maxShield } = affected.hullState;
    return maxShield > 0 ? 1 - deflectorShieldDampening * shield / maxShield : 1;
}

/**
 * Leave a deflector's effect on a system, at the given strength: its level is multiplied by that (or its duration, if it has no levels).
 * Its level adds to any level of the same effect that's already there, and it then lasts for the deflector's duration, unless it was already going to last longer.
 */
export function leaveEffect(gameState: GameState, system: SystemState, outcome: DeflectorOutcome, strength: number) {
    const findEffect = () => system.getEffects().find(effect => effect.type === outcome.effect);
    const previousEnd = findEffect()?.progress?.endTime ?? 0;

    const effectType = outcome.effect;
    let duration = outcome.duration;

    if (isLeveledSystemEffectType(effectType)) {
        system.adjustEffectLevel(effectType, weakenLevel(outcome.level ?? 1, strength));
    } else {
        system.addEffect(effectType);
        duration = weakenDuration(duration, strength);
    }

    const effect = findEffect();
    const currentTime = gameState.currentTime;
    if (effect && currentTime + duration > previousEnd) {
        effect.progress = new CooldownState(currentTime, currentTime + duration);
    }
}

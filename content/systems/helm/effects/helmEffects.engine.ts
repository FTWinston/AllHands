import { distanceSq } from 'common-data/features/space/utils/vectors';
import { defineEngineEffects } from 'engine/content/EngineContent';
import { SystemEffectFunctionality } from 'engine/effects/EngineSystemEffectDefinition';
import { effects as sharedEffects, interposeBlockRadius, momentumEvasionPerLevel, momentumSpeedPerLevel } from './helmEffects.shared';
import type { Ship } from 'engine/state/Ship';
import type { EngineerSystemTile } from 'engine/state/systems/engineer/EngineerSystemTile';
import type { HelmState } from 'engine/state/systems/HelmState';

/** The ship that's interposing for each screened ship, keyed by that ship's helm tile. It's engine-only: clients only need to know the ship is screened. */
const interposers = new WeakMap<EngineerSystemTile, Ship>();

function getHelmTile(ship: Ship) {
    return ship.engineerState.systems.find(tile => tile.system === 'helm') ?? null;
}

/** Have an interposing ship screen another, until that's undone (see `unscreenShip`). Another ship that was screening it is replaced. Returns false if the screened ship has no helm. */
export function screenShip(interposer: Ship, screened: Ship): boolean {
    const helm = getHelmTile(screened);
    if (!helm || interposer === screened) {
        return false;
    }

    // Set first, as the effect's apply looks it up. Adding an effect that's already there leaves it as it was.
    interposers.set(helm, interposer);
    return helm.addEffect('screened');
}

/** Stop an interposing ship screening another. Does nothing if a different ship has taken over screening it since. */
export function unscreenShip(interposer: Ship, screened: Ship) {
    const helm = getHelmTile(screened);
    if (helm && interposers.get(helm) === interposer) {
        helm.removeEffect('screened', 'expired');
    }
}

/**
 * The ship that takes a shot from the shooter at the target in its place, if there is one: the ship interposing for the target, so long as it's still about,
 * and between the shooter and the target. That's within the block radius of the line from one to the other, and not past either end.
 */
export function getInterceptingShip(shooter: Ship, target: Ship, time: number): Ship | null {
    const helm = getHelmTile(target);
    const interposer = helm && helm.hasEffect('screened') ? interposers.get(helm) : undefined;
    if (!interposer || interposer === shooter || interposer === target || interposer.helmState.getGameState().objects.get(interposer.id) !== interposer) {
        return null;
    }

    const from = shooter.getPosition(time);
    const to = target.getPosition(time);
    const at = interposer.getPosition(time);
    const lineLengthSq = distanceSq(from, to);
    if (lineLengthSq === 0) {
        return null;
    }

    // How far along the line the interposer's nearest point is: 0 at the shooter, 1 at the target.
    const along = ((at.x - from.x) * (to.x - from.x) + (at.y - from.y) * (to.y - from.y)) / lineLengthSq;
    if (along < 0 || along > 1) {
        return null;
    }

    const nearest = { x: from.x + (to.x - from.x) * along, y: from.y + (to.y - from.y) * along };
    return distanceSq(at, nearest) <= interposeBlockRadius ** 2 ? interposer : null;
}

type HelmModifier = 'maneuverSpeedModifier' | 'evasionModifier' | 'weaponAccuracyModifier';

/** Extra to do when the level of a helm effect changes, as well as adjusting what it modifies. */
type LevelListener = (helm: HelmState, level: number) => void;

/**
 * Create an effect that only goes on the helm, and adds to (or takes from) one of its modifiers for as long as it's there.
 * @param modifier The helm modifier to change.
 * @param amountPerLevel How much each level of the effect adds to it. Negative to take away.
 */
function createHelmModifierEffect(modifier: HelmModifier, amountPerLevel: number, onLevel?: LevelListener, secondModifier?: { modifier: HelmModifier; amountPerLevel: number }): SystemEffectFunctionality {
    const adjust = (helm: HelmState, levels: number) => {
        helm[modifier] += levels * amountPerLevel;
        if (secondModifier) {
            helm[secondModifier.modifier] += levels * secondModifier.amountPerLevel;
        }
    };

    return {
        apply: (system, level) => {
            if (system.system !== 'helm') {
                return false;
            }

            const helm = system.systemState.getShip().helmState;
            adjust(helm, level);
            onLevel?.(helm, level);
            return true;
        },
        remove: (system, _removal, level) => {
            const helm = system.systemState.getShip().helmState;
            adjust(helm, -level);
            onLevel?.(helm, 0);
        },
        onLevelChanged: (system, newLevel, oldLevel) => {
            const helm = system.systemState.getShip().helmState;
            adjust(helm, newLevel - oldLevel);
            onLevel?.(helm, newLevel);
        },
    };
}

export const effects = defineEngineEffects(sharedEffects, {
    // Each level speeds up every maneuver the ship starts, and makes it harder to hit. `HelmState` adds and takes away the levels that flying earns and loses,
    // and is told the level too, as the helm's client can't see its effects.
    momentum: createHelmModifierEffect('maneuverSpeedModifier', momentumSpeedPerLevel, (helm, level) => helm.momentumLevelChanged(level), { modifier: 'evasionModifier', amountPerLevel: momentumEvasionPerLevel }),
    holdingSteady: createHelmModifierEffect('weaponAccuracyModifier', 1),
    jinking: createHelmModifierEffect('weaponAccuracyModifier', -1),
    // Shadow sets which ship, and how wide an arc, as it adds this (see `HelmState.isShadowingFromBehind`). Whenever the effect goes, so does the bonus.
    shadowing: {
        apply: system => system.system === 'helm',
        remove: (system) => {
            const helm = system.systemState.getShip().helmState;
            helm.shadowTargetId = '';
            helm.shadowRearArc = 0;
        },
    },
    // Each level is a level of power added to the tactical system, until the effect goes.
    attackRun: {
        apply: (system, level) => {
            if (system.system !== 'tactical') {
                return false;
            }

            system.adjustSystemPowerLevel(level);
            return true;
        },
        remove: (system, _removal, level) => {
            system.adjustSystemPowerLevel(-level);
        },
        onLevelChanged: (system, newLevel, oldLevel) => {
            system.adjustSystemPowerLevel(newLevel - oldLevel);
        },
    },
    screened: {
        apply: system => system.system === 'helm',
        remove: system => interposers.delete(system),
    },
});

import { defineEngineEffects } from 'engine/content/EngineContent';
import { SystemEffectFunctionality } from 'engine/effects/EngineSystemEffectDefinition';
import { effects as sharedEffects, momentumEvasionPerLevel, momentumSpeedPerLevel } from './helmEffects.shared';
import type { HelmState } from 'engine/state/systems/HelmState';

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
    // Each level takes 1 off the cost of every card the tactical system has, until the effect goes.
    attackRun: {
        apply: (system, level) => {
            if (system.system !== 'tactical') {
                return false;
            }

            system.systemState.adjustCostOfEveryCard(-level);
            return true;
        },
        remove: (system, _removal, level) => {
            system.systemState.adjustCostOfEveryCard(level);
        },
        onLevelChanged: (system, newLevel, oldLevel) => {
            system.systemState.adjustCostOfEveryCard(oldLevel - newLevel);
        },
    },
});

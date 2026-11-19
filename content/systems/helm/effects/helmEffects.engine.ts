import { defineEngineEffects } from 'engine/content/EngineContent';
import { SystemEffectFunctionality } from 'engine/effects/EngineSystemEffectDefinition';
import { effects as sharedEffects, momentumSpeedPerLevel } from './helmEffects.shared';
import type { HelmState } from 'engine/state/systems/HelmState';

type HelmModifier = 'maneuverSpeedModifier' | 'evasionModifier' | 'weaponAccuracyModifier';

/**
 * Create an effect that only goes on the helm, and adds to (or takes from) one of its modifiers for as long as it's there.
 * @param modifier The helm modifier to change.
 * @param amountPerLevel How much each level of the effect adds to it. Negative to take away.
 */
function createHelmModifierEffect(modifier: HelmModifier, amountPerLevel: number): SystemEffectFunctionality {
    const adjust = (helm: HelmState, levels: number) => {
        helm[modifier] += levels * amountPerLevel;
    };

    return {
        apply: (system, level) => {
            if (system.system !== 'helm') {
                return false;
            }

            adjust(system.systemState.getShip().helmState, level);
            return true;
        },
        remove: (system, _removal, level) => {
            adjust(system.systemState.getShip().helmState, -level);
        },
        onLevelChanged: (system, newLevel, oldLevel) => {
            adjust(system.systemState.getShip().helmState, newLevel - oldLevel);
        },
    };
}

export const effects = defineEngineEffects(sharedEffects, {
    // Each level speeds up every maneuver the ship starts. `HelmState` adds and takes away the levels that flying earns and loses.
    momentum: createHelmModifierEffect('maneuverSpeedModifier', momentumSpeedPerLevel),
    hardBrakeEvasion: createHelmModifierEffect('evasionModifier', 1),
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
    braced: {
        apply: (system, level) => {
            if (system.system !== 'hull') {
                return false;
            }

            // Reduce the damage the hull takes by level percent.
            system.systemState.applyDamage.addHandler('braced', false, damage => damage * (1 - level / 100));
            return true;
        },
        remove: (system) => {
            system.systemState.applyDamage.removeHandler('braced');
        },
        onLevelChanged: (system, newLevel) => {
            // addHandler replaces the old handler, so we can just call it again with the new level.
            system.systemState.applyDamage.addHandler('braced', false, damage => damage * (1 - newLevel / 100));
        },
    },
});

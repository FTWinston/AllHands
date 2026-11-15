import { defineEngineEffects } from 'engine/content/EngineContent';
import { effects as sharedEffects } from './scienceEffects.shared';

export const effects = defineEngineEffects(sharedEffects, {
    antiprotonResidue: {
        apply: (system, level) => {
            // Increase damage taken from all sources by level percent.
            system.systemState.applyDamage.addHandler('antiprotonResidue', false, damage => damage * (1 + level / 100));
            return true;
        },
        remove: (system) => {
            system.systemState.applyDamage.removeHandler('antiprotonResidue');
        },
        onLevelChanged: (system, newLevel) => {
            // addHandler replaces the old handler, so we can just call it again with the new level.
            system.systemState.applyDamage.addHandler('antiprotonResidue', false, damage => damage * (1 + newLevel / 100));
        },
    },
    chronitonSaturation: {
        apply: (system) => {
            // Block every second scheduled draw while this effect is active, starting with the first.
            let blockNext = true;
            system.systemState.scheduledDraw.addInterceptor('chronitonSaturation', () => {
                const block = blockNext;
                blockNext = !blockNext;
                return block;
            });
            return true;
        },
        remove: (system) => {
            system.systemState.scheduledDraw.removeInterceptor('chronitonSaturation');
        },
    },
    polaronBombardment: {
        apply: (system, level) => {
            system.adjustSystemPowerLevel(-level);
            return true;
        },
        remove: (system, _removal, level) => {
            system.adjustSystemPowerLevel(level);
        },
        onLevelChanged: (system, newLevel, oldLevel) => {
            system.adjustSystemPowerLevel(oldLevel - newLevel);
        },
    },
    polaronAccumulation: {
        apply: (system) => {
            system.adjustSystemPowerLevel(1);
            return true;
        },
        remove: (system) => {
            system.adjustSystemPowerLevel(-1);
        },
    },
    tetryonSaturation: {
        apply: (system, level) => {
            system.systemState.chanceToHitPercentageModifier += level;
            return true;
        },
        remove: (system, _removal, level) => {
            system.systemState.chanceToHitPercentageModifier -= level;
        },
        onLevelChanged: (system, newLevel, oldLevel) => {
            system.systemState.chanceToHitPercentageModifier += newLevel - oldLevel;
        },
    },
    reducedCardCost: {
        apply: (system) => {
            system.systemState.adjustCostOfEveryCard(-1);
            return true;
        },
        remove: (system) => {
            system.systemState.adjustCostOfEveryCard(1);
        },
    },
});

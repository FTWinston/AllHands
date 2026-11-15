import { defineEffects } from 'common-data/content/SharedContent';
import { SystemEffectCategory } from 'common-data/features/ships/types/SystemEffectDefinition';
import { extendedShieldsDuration } from 'common-data/features/ships/utils/extendedShields';
import { MAX_POWER_LEVEL } from 'common-data/features/ships/utils/powerLevel';
import { transferPowerDuration } from 'content/systems/engineer/cards/engineerCards.shared';

export const effects = defineEffects({
    auxPower: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: 30_000,
    },
    shieldFocus: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: 20_000,
    },
    shieldsExtended: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: extendedShieldsDuration,
    },
    /** On a ship's hull: another ship is powering this one (see the Transfer Power card). It does nothing itself: an encounter decides what that's worth. */
    powerReceived: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: transferPowerDuration,
    },
    /** This system runs lower until it's brought back (see the Run Quiet card). It has no time limit. */
    runningQuiet: {
        category: SystemEffectCategory.Neutral,
        usesLevels: false,
    },
    shieldReduced: {
        category: SystemEffectCategory.Negative,
        usesLevels: false,
        duration: 20_000,
    },
    resetting: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: 3_000,
    },
    relocating: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
    },
    overcharge: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: 15_000,
        tickInterval: 1_000,
    },
    distributePowerLoss: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        maxLevel: 3,
        duration: 30_000,
    },
    distributePowerGain: {
        category: SystemEffectCategory.Positive,
        usesLevels: true,
        maxLevel: 3,
        duration: 30_000,
    },
    drawPowerGain: {
        category: SystemEffectCategory.Positive,
        usesLevels: true,
        maxLevel: 3,
        duration: 30_000,
    },
    drawPowerLoss: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        maxLevel: 3,
        duration: 30_000,
    },
    divertAllPowerGain: {
        category: SystemEffectCategory.Positive,
        usesLevels: true,
        maxLevel: MAX_POWER_LEVEL,
        duration: 20_000,
    },
    divertAllPowerLoss: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        maxLevel: 1,
        duration: 20_000,
    },
    divertHelmGain: {
        category: SystemEffectCategory.Positive,
        usesLevels: true,
        maxLevel: 3,
        duration: 20_000,
    },
    divertHelmLoss: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        maxLevel: 3,
        duration: 20_000,
    },
    divertScienceGain: {
        category: SystemEffectCategory.Positive,
        usesLevels: true,
        maxLevel: 3,
        duration: 20_000,
    },
    divertScienceLoss: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        maxLevel: 3,
        duration: 20_000,
    },
    divertTacticalGain: {
        category: SystemEffectCategory.Positive,
        usesLevels: true,
        maxLevel: 3,
        duration: 20_000,
    },
    divertTacticalLoss: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        maxLevel: 3,
        duration: 20_000,
    },
});

import { SystemEffectDefinition, SystemEffectCategory } from '../types/SystemEffectDefinition';

export const MAX_POWER_LEVEL = 5;

/** How long a ship's shields stay extended over a friendly ship, once the Extend Shields card is played. */
export const extendedShieldsDuration = 10_000;

/** How close a friendly ship has to be for extended shields to cover it, in world units. Staying that close is helm's job. */
export const extendedShieldsRange = 4;

/** How long a friendly ship is powered from another, once the Transfer Power card is played. */
export const transferPowerDuration = 20_000;

/** How close a friendly ship has to be for Transfer Power to reach it, in world units. */
export const transferPowerRange = 6;

/** How much lower a system runs while it's running quiet (see the Run Quiet card). */
export const runQuietPowerLoss = 2;

/** How long a flare burns, once the Flare card is played. */
export const flareDuration = 8000;

/** How long the mark of the quarantine gate's pulse stays on the system it landed on. */
export const gatePulseDuration = 4000;

/** How long a Shutdown Key stays turned, once it's played. */
export const keyTurnedDuration = 5000;

/** How long the mark of a customs platform's inspection ping stays on the system it landed on. */
export const inspectionPingDuration = 8000;

/** How long a shield tuning lasts after the hull card that set it is played, unless another hull card renews or replaces it. */
const SHIELD_TUNING_DURATION = 12_000;

// Enforce that values are of a system effect type, without widening the key type to "string".
function defineSystemEffects<T extends Record<string, SystemEffectDefinition>>(defs: T) {
    return defs;
}

export const systemEffectDefinitions = defineSystemEffects({
    /** A shield tuning, set by playing an emitter: the shields are drained less by what they absorb (see shieldStats). */
    shieldReinforced: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: SHIELD_TUNING_DURATION,
    },
    /** A shield tuning, set by playing an energy tuning card: hits from energy weapons do less damage. */
    shieldTunedEnergy: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: SHIELD_TUNING_DURATION,
    },
    /** A shield tuning, set by playing a torpedo tuning card: torpedo hits do less damage. */
    shieldTunedTorpedo: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: SHIELD_TUNING_DURATION,
    },
    /** How many more hull cards that would tune the shields must be played before they can tune them again. */
    shieldScrambled: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
    },
    auxPower: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: 30_000,
    },
    reducedPower: {
        category: SystemEffectCategory.Neutral,
        usesLevels: true,
        maxLevel: MAX_POWER_LEVEL,
    },
    damagedCard: {
        category: SystemEffectCategory.Neutral,
        usesLevels: false,
    },
    feedback: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        duration: 20_000,
    },
    disruptGeneration: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
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
    /** On a ship's tactical system: a flare it launched is burning. It does nothing itself: an encounter decides what that's worth. */
    flareBurning: {
        category: SystemEffectCategory.Neutral,
        usesLevels: false,
        duration: flareDuration,
    },
    /** What the quarantine gate's pulse leaves behind, each time its master pylon changes its shields. It does nothing: when it lands is what matters. */
    gatePulse: {
        category: SystemEffectCategory.Neutral,
        usesLevels: false,
        duration: gatePulseDuration,
    },
    /** This system's Shutdown Key is turned. It does nothing itself: the gate listens for all four of a ship's being turned at once. */
    keyTurned: {
        category: SystemEffectCategory.Neutral,
        usesLevels: false,
        duration: keyTurnedDuration,
    },
    // What a customs platform's inspection ping leaves behind. They do nothing: which one it is says how the platform is keyed.
    phasedPing: {
        category: SystemEffectCategory.Neutral,
        usesLevels: false,
        duration: inspectionPingDuration,
    },
    coherentPing: {
        category: SystemEffectCategory.Neutral,
        usesLevels: false,
        duration: inspectionPingDuration,
    },
    invertedPing: {
        category: SystemEffectCategory.Neutral,
        usesLevels: false,
        duration: inspectionPingDuration,
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
    reactorBreach: {
        category: SystemEffectCategory.Negative,
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
    antiprotonResidue: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        duration: 12_000,
    },
    chronitonSaturation: {
        category: SystemEffectCategory.Negative,
        usesLevels: false,
        duration: 45_000,
    },
    polaronBombardment: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        duration: 10_000,
    },
    polaronAccumulation: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: 10_000,
    },
    tetryonSaturation: {
        category: SystemEffectCategory.Negative,
        usesLevels: true,
        duration: 8_000,
    },
    reducedCardCost: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
    },
} as const);

export type SystemEffectType = keyof typeof systemEffectDefinitions;

export type LeveledSystemEffectType = {
    [K in SystemEffectType]: typeof systemEffectDefinitions[K]['usesLevels'] extends true ? K : never
}[SystemEffectType];

export type NonLeveledSystemEffectType = Exclude<SystemEffectType, LeveledSystemEffectType>;

export function isLeveledSystemEffectType(effectType: SystemEffectType): effectType is LeveledSystemEffectType {
    return systemEffectDefinitions[effectType].usesLevels;
}

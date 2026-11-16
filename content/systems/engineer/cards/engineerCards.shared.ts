import { defineCards } from 'common-data/content/SharedContent';
import { extendedShieldsDuration, extendedShieldsRange } from 'common-data/features/ships/utils/extendedShields';

/** How long a friendly ship is powered from another, once the Transfer Power card is played. */
export const transferPowerDuration = 20_000;
/** How close a friendly ship has to be for Transfer Power to reach it, in world units. */
export const transferPowerRange = 6;
/** How much lower a system runs while it's running quiet (see the Run Quiet card). */
export const runQuietPowerLoss = 2;
/** How often a system that's running quiet gains a Charge. */
export const runQuietChargeInterval = 10_000;
/** The most Charge a system can hold. */
export const chargeMaxLevel = 5;
/** The level of Flux at which a system overloads: one of its cards is damaged, and its Flux goes back to nothing. */
export const fluxLimit = 3;
/** How much lower a system runs while it's banking power (see the Bank Power card). */
export const bankPowerLoss = 2;
/** How long a system banks power for. */
export const bankPowerDuration = 20_000;
/** How much Charge a system gains when it has finished banking power. */
export const bankPowerCharge = 2;
/** How much power a discharging system gains for each Charge that was spent (see the Discharge card). */
export const dischargePowerPerLevel = 1;
/** How long a system's Discharge lasts. */
export const dischargeDuration = 10_000;
/** How much higher a system runs while it's redlining (see the Redline card). */
export const redlinePowerGain = 2;
/** How often a redlining system gains a Flux. */
export const redlineFluxInterval = 5_000;
/** How long the shields are down for, after the Vent card is played. */
export const ventShieldsDownDuration = 3_000;
/** How much power a system gains from Burnout for each Flux that was spent. */
export const burnoutPowerPerLevel = 2;
/** How long a system's Burnout lasts, before the system resets. */
export const burnoutDuration = 8_000;
/** How long the lower-powered system of a Bus Link keeps the power it was given. */
export const busLinkDuration = 20_000;
/** How much power each system in a column gains from the Rail Feed card. */
export const railFeedPowerGain = 1;
/** How long Rail Feed's power lasts. */
export const railFeedDuration = 20_000;
/** How long the rest of the crew have to confirm an Auto-destruct, before the request lapses. */
export const autoDestructConfirmWindow = 30_000;
/** How many of the other crew members have to confirm an Auto-destruct for its countdown to start. */
export const autoDestructConfirmationsNeeded = 2;
/** How long the Auto-destruct countdown runs before the ship explodes. */
export const autoDestructDuration = 15_000;
/** How close another ship has to be to an auto-destructing ship to be caught in its explosion, in world units. */
export const autoDestructRange = 6;
/** How much damage the explosion of an auto-destructing ship does to each other ship it catches. */
export const autoDestructDamage = 60;
/** How much power every system gains from the Emergency Power card. */
export const emergencyPowerGain = 3;
/** How long Emergency Power lasts. */
export const emergencyPowerDuration = 12_000;
/** How much Flux every system gains when Emergency Power ends. */
export const emergencyPowerFlux = 2;

export const cards = defineCards({
    smokeScreen: {
        targetType: 'no-target',
        system: 'engineer',
        parameters: { cost: 3 },
    },
    auxPower: {
        targetType: 'system',
        system: 'engineer',
        traits: ['expendable'],
        parameters: { cost: 1, powerGain: 1 },
    },
    swapSystems: {
        targetType: 'choice',
        system: 'engineer',
        cards: ['swapHorizontal', 'swapUp', 'swapDown'],
        parameters: { cost: 3 },
    },
    swapHorizontal: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3 },
    },
    swapUp: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3 },
    },
    swapDown: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3 },
    },
    purge: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3 },
    },
    reset: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 4, duration: 3 },
    },
    focusShields: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 1, shieldBoost: 50, shieldReduction: 10 },
    },
    extendShields: {
        targetType: 'no-target',
        system: 'engineer',
        parameters: { cost: 3, duration: extendedShieldsDuration / 1000, range: extendedShieldsRange },
    },
    transferPower: {
        targetType: 'no-target',
        rarity: 'uncommon',
        system: 'engineer',
        parameters: { cost: 4, duration: transferPowerDuration / 1000, range: transferPowerRange },
    },
    runQuiet: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 1, powerChange: runQuietPowerLoss, charge: 1, interval: runQuietChargeInterval / 1000 },
    },
    relocateSystem: {
        targetType: 'system',
        rarity: 'rare',
        system: 'engineer',
        parameters: { cost: 5 },
    },
    relocateHere: {
        targetType: 'system',
        system: 'engineer',
        traits: ['expendable'],
        parameters: { cost: 1 },
    },
    sustain: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 2 },
    },
    distributePower: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3, powerChange: 1, duration: 30 },
    },
    drawPower: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3, powerChange: 1, duration: 30 },
    },
    divertAllPower: {
        targetType: 'system',
        rarity: 'uncommon',
        system: 'engineer',
        parameters: { cost: 4, lossPerSystem: 1, duration: 20, targetGain: 5 },
    },
    divertSystemPower: {
        targetType: 'choice',
        system: 'engineer',
        cards: ['divertHelm', 'divertScience', 'divertTactical'],
        parameters: { cost: 3 },
    },
    divertHelm: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3, maxAmount: 3, duration: 20 },
    },
    divertScience: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3, maxAmount: 3, duration: 20 },
    },
    divertTactical: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3, maxAmount: 3, duration: 20 },
    },
    overcharge: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 2, powerGain: 3, duration: 15 },
    },
    shunt: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 3 },
    },
    drawPriority: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 2 },
    },
    trickleCharge: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 1, charge: 1 },
    },
    bankPower: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 1, powerChange: bankPowerLoss, duration: bankPowerDuration / 1000, charge: bankPowerCharge },
    },
    discharge: {
        targetType: 'system',
        rarity: 'uncommon',
        system: 'engineer',
        parameters: { cost: 1, powerGain: dischargePowerPerLevel, duration: dischargeDuration / 1000 },
    },
    surgeDraw: {
        targetType: 'system',
        rarity: 'uncommon',
        system: 'engineer',
        parameters: { cost: 1, cardsPerLevel: 1 },
    },
    redline: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 1, powerGain: redlinePowerGain, flux: 1, interval: redlineFluxInterval / 1000 },
    },
    vent: {
        targetType: 'no-target',
        system: 'engineer',
        parameters: { cost: 2, duration: ventShieldsDownDuration / 1000 },
    },
    railFeed: {
        targetType: 'system',
        rarity: 'uncommon',
        system: 'engineer',
        parameters: { cost: 3, powerGain: railFeedPowerGain, duration: railFeedDuration / 1000 },
    },
    coolantFlush: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 2 },
    },
    burnout: {
        targetType: 'system',
        rarity: 'uncommon',
        system: 'engineer',
        parameters: { cost: 2, powerGain: burnoutPowerPerLevel, duration: burnoutDuration / 1000 },
    },
    busLink: {
        targetType: 'system',
        rarity: 'uncommon',
        system: 'engineer',
        parameters: { cost: 3, duration: busLinkDuration / 1000 },
    },
    daisyChain: {
        targetType: 'system',
        rarity: 'uncommon',
        system: 'engineer',
        parameters: { cost: 3 },
    },
    groundOut: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 2 },
    },
    juryRig: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 2, cards: 1 },
    },
    fabricate: {
        targetType: 'system',
        rarity: 'uncommon',
        system: 'engineer',
        parameters: { cost: 2 },
    },
    priorityFeed: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 1, cards: 1 },
    },
    buffer: {
        targetType: 'system',
        rarity: 'uncommon',
        system: 'engineer',
        parameters: { cost: 2, charge: 1 },
    },
    hotStart: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 1, cards: 2, flux: 1 },
    },
    extremeMeasures: {
        targetType: 'choice',
        rarity: 'rare',
        system: 'engineer',
        cards: ['autoDestruct', 'cannibalise', 'emergencyPower'],
        parameters: { cost: 4 },
    },
    autoDestruct: {
        targetType: 'no-target',
        system: 'engineer',
        parameters: {
            cost: 4, duration: autoDestructDuration / 1000, range: autoDestructRange, damage: autoDestructDamage,
            window: autoDestructConfirmWindow / 1000, confirmations: autoDestructConfirmationsNeeded,
        },
    },
    // An engineer card that is dealt to the other crew members' hands (see the Auto-destruct card), and played from there.
    confirmAutoDestruct: {
        targetType: 'no-target',
        system: 'engineer',
        traits: ['expendable', 'priority'],
        parameters: { cost: 0 },
    },
    abortAutoDestruct: {
        targetType: 'no-target',
        system: 'engineer',
        traits: ['expendable', 'priority'],
        parameters: { cost: 0 },
    },
    cannibalise: {
        targetType: 'system',
        system: 'engineer',
        parameters: { cost: 4 },
    },
    graft: {
        targetType: 'system',
        system: 'engineer',
        traits: ['expendable'],
        parameters: { cost: 1 },
    },
    emergencyPower: {
        targetType: 'no-target',
        system: 'engineer',
        parameters: { cost: 4, powerGain: emergencyPowerGain, duration: emergencyPowerDuration / 1000, flux: emergencyPowerFlux },
    },
});

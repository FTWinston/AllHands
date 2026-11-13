import { defineCards, defineEffects, defineSharedContent } from 'common-data/content/SharedContent';
import { SystemEffectCategory } from 'common-data/features/ships/types/SystemEffectDefinition';

/** How long the mark of the quarantine gate's pulse stays on the system it landed on. */
export const gatePulseDuration = 4000;

/** How long a Shutdown Key stays turned, once it's played. */
export const keyTurnedDuration = 5000;

/** How long Key Power keeps a system a level up, which is long enough to power all four of a ship's keys in turn, and not much longer. */
export const keyPowerDuration = 10_000;

const effects = defineEffects({
    /** What the quarantine gate's pulse leaves behind, each time its master pylon changes its shields. It does nothing: when it lands is what matters. */
    gatePulse: {
        category: SystemEffectCategory.Neutral,
        usesLevels: false,
        duration: gatePulseDuration,
    },
    /** This system runs a level higher for a while (see the Key Power card). Unlike Aux Power, any number of a ship's systems can have it at once. */
    keyPower: {
        category: SystemEffectCategory.Positive,
        usesLevels: false,
        duration: keyPowerDuration,
    },
    /** This system's Shutdown Key is turned. It does nothing itself: the gate listens for all four of a ship's being turned at once. */
    keyTurned: {
        category: SystemEffectCategory.Neutral,
        usesLevels: false,
        duration: keyTurnedDuration,
    },
});

const cards = defineCards({
    // The quarantine gate's Shutdown Keys, one for each station, as every card belongs to one system. They're only ever handed out by the gate's keepers.
    shutdownKeyHelm: {
        targetType: 'no-target',
        system: 'helm',
        traits: ['priority'],
        parameters: { cost: 4, duration: keyTurnedDuration / 1000 },
    },
    shutdownKeyScience: {
        targetType: 'no-target',
        system: 'science',
        traits: ['priority'],
        parameters: { cost: 4, duration: keyTurnedDuration / 1000 },
    },
    shutdownKeyTactical: {
        targetType: 'no-target',
        system: 'tactical',
        traits: ['priority'],
        parameters: { cost: 4, duration: keyTurnedDuration / 1000 },
    },
    shutdownKeyEngineer: {
        targetType: 'no-target',
        system: 'engineer',
        traits: ['priority'],
        parameters: { cost: 4, duration: keyTurnedDuration / 1000 },
    },
    // What the gate's keepers give the engineer to power the keys with. Aux Power can only be on one system at a time, and the keys need four.
    keyPower: {
        targetType: 'system',
        system: 'engineer',
        traits: ['priority'],
        parameters: { cost: 1, powerGain: 1, duration: keyPowerDuration / 1000 },
    },
});

export const quarantineGateShared = defineSharedContent({ cards, effects });

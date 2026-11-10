import { MAX_POWER_LEVEL } from 'common-data/features/ships/utils/systemEffectDefinitions';
import type { AiGoalInfo, AiShipSetupInfo, NonCrewSystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import type { ShipAppearance } from 'common-data/features/space/types/ObjectAppearance';
import type { Position } from 'common-data/features/space/types/Position';
import type { IRandom } from 'common-data/types/IRandom';

export type EnemyRole = 'scout' | 'fighter' | 'heavy' | 'flagship';

type HullCards = NonCrewSystemSetupInfo['cards'];
type ReactorCards = AiShipSetupInfo['reactor']['cards'];

/** Interleave the given numbers of each type of hull card, so they're spread through the deck. */
function interleaveHullCards(counts: Partial<Record<HullCards[number], number>>): HullCards {
    const remaining = Object.entries(counts) as [HullCards[number], number][];
    const cards: HullCards = [];

    while (remaining.some(([, count]) => count > 0)) {
        for (const entry of remaining) {
            if (entry[1] > 0) {
                cards.push(entry[0]);
                entry[1]--;
            }
        }
    }

    return cards;
}

/**
 * A hull with the given numbers of each type of hull card, which also make up its health.
 * Each emitter adds 15 shield capacity, and each volatile emitter 45. Emitters and tuning cards set the shields' mode when drawn.
 * Plating does nothing but add health, so the more of it a hull has, the less of the time its shields are in any mode.
 */
const hull = (cards: Partial<Record<HullCards[number], number>>): NonCrewSystemSetupInfo => ({
    cards: interleaveHullCards(cards),
    maxPowerLevel: MAX_POWER_LEVEL,
    initialHandSize: 0,
});

/**
 * Each reactor card gives its system one level of baseline power (and makes it draw cards more often),
 * so a role's strengths come from the `extra` cards on top of the basic sets.
 */
const reactorCards = (sets: number, ...extra: ReactorCards) => [
    ...Array(sets).fill(['reactorPowerHull', 'reactorPowerHelm', 'reactorPowerTactical', 'reactorPowerEngineer', 'reactorPowerScience', 'reactorPowerReactor']).flat(),
    ...extra,
] as ReactorCards;

/** Systems aren't capped below the usual maximum: their power comes from the reactor deck. */
const system = <T extends string>(cards: T[], initialHandSize = 1) => ({ cards, maxPowerLevel: MAX_POWER_LEVEL, initialHandSize });

/** The original "An Enemy" ship from the old default scenario; all other roles are tweaks of it. */
const fighterTemplate: Omit<AiShipSetupInfo, 'name' | 'faction' | 'position' | 'goal'> = {
    appearance: 'swallowtail-interceptor',
    skill: 1,
    // 60 shield capacity, sometimes tuned against energy weapons.
    hull: hull({ hullShieldEmitter: 4, hullShieldTuningEnergy: 2, hullPlating: 2 }),
    // Loading a torpedo takes 3 tactical power.
    reactor: system(reactorCards(2, 'reactorPowerTactical'), 0),
    helm: system(['slowAndSteady', 'zigZag', 'strafe', 'slowAndSteady']),
    science: system(['passiveScan', 'passiveScan', 'passiveScan', 'passiveScan', 'passiveScan']),
    tactical: { ...system(['photonTorpedo', 'lowYield', 'fullSpread']), numSlots: 1 },
    engineer: system(['auxPower', 'auxPower', 'distributePower']),
};

const roleTemplates: Record<EnemyRole, Omit<AiShipSetupInfo, 'name' | 'faction' | 'position' | 'goal'>> = {
    scout: {
        ...fighterTemplate,
        // A small shield (30), and a flimsy hull.
        hull: hull({ hullShieldEmitter: 2, hullShieldTuningEnergy: 1, hullPlating: 2 }),
        reactor: system(reactorCards(2, 'reactorPowerTactical', 'reactorPowerHelm'), 0),
        helm: system(['zigZag', 'strafe', 'zigZag', 'slowAndSteady']),
        tactical: { ...system(['lowYield', 'lowYield', 'photonTorpedo']), numSlots: 1 },
        fleeThreshold: 0.4,
    },
    fighter: fighterTemplate,
    heavy: {
        ...fighterTemplate,
        // A big shield (135), a third of it from a volatile emitter, sometimes tuned against torpedoes.
        hull: hull({ hullShieldEmitter: 6, hullVolatileEmitter: 1, hullShieldTuningTorpedo: 2, hullPlating: 3 }),
        reactor: system(reactorCards(2, 'reactorPowerTactical', 'reactorPowerHull', 'reactorPowerEngineer'), 0),
        tactical: { ...system(['photonTorpedo', 'lowYield', 'fullSpread', 'photonTorpedo', 'lowYield']), numSlots: 2 },
        engineer: system(['auxPower', 'auxPower', 'distributePower', 'auxPower']),
        fleeThreshold: 0,
    },
    flagship: {
        ...fighterTemplate,
        // The biggest shield (210), with two volatile emitters, sometimes tuned against either weapon type.
        hull: hull({ hullShieldEmitter: 8, hullVolatileEmitter: 2, hullShieldTuningEnergy: 2, hullShieldTuningTorpedo: 2, hullPlating: 2 }),
        reactor: system(reactorCards(3, 'reactorPowerTactical', 'reactorPowerHull'), 0),
        tactical: { ...system(['photonTorpedo', 'lowYield', 'fullSpread', 'photonTorpedo', 'lowYield', 'fullSpread']), numSlots: 3 },
        engineer: system(['auxPower', 'auxPower', 'distributePower', 'auxPower', 'distributePower']),
        fleeThreshold: 0,
    },
};

const roleNames: Record<EnemyRole, string> = {
    scout: 'Scout',
    fighter: 'Fighter',
    heavy: 'Heavy Cruiser',
    flagship: 'Flagship',
};

/** Each faction's ships of a role share a design, so the same shape always means the same kind of enemy. */
const factionAppearances: Record<string, Record<EnemyRole, ShipAppearance>> = {
    factionA: { scout: 'dart-fighter', fighter: 'swallowtail-interceptor', heavy: 'hammerhead-cruiser', flagship: 'manta-command-ship' },
    factionB: { scout: 'kite-scout', fighter: 'trident-raider', heavy: 'wedge-destroyer', flagship: 'crescent-battlecruiser' },
    factionC: { scout: 'lance-interceptor', fighter: 'mantis-drone', heavy: 'segmented-battleship', flagship: 'spinal-gun-dreadnought' },
};

/** Faction-specific competence multiplier, so later-sector factions play better. */
const factionSkill: Record<string, number> = {
    factionA: 0.7,
    factionB: 0.85,
    factionC: 1,
};

export interface EnemySetupOptions {
    scenarioId?: string;
    goal?: AiGoalInfo;
    name?: string;
}

export function createEnemySetup(role: EnemyRole, factionId: string, position: Position, options: EnemySetupOptions = {}): AiShipSetupInfo {
    const template = roleTemplates[role];
    return {
        ...template,
        appearance: (factionAppearances[factionId] ?? factionAppearances.factionA)[role],
        name: options.name ?? `${factionId} ${roleNames[role]}`,
        faction: factionId,
        position,
        goal: options.goal ?? { type: 'search-and-destroy' },
        skill: template.skill * (factionSkill[factionId] ?? 0.8),
        ...(options.scenarioId !== undefined ? { id: options.scenarioId } : {}),
    };
}

const spawnDistanceMin = 8;
const spawnDistanceRange = 4;

/** A position on a ring around the origin, facing inward (as the old endless respawn did). */
export function ringPosition(random: IRandom, angle: number = random.getFloat(0, Math.PI * 2)): Position {
    const distance = random.getFloat(spawnDistanceMin, spawnDistanceMin + spawnDistanceRange);
    return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        angle: angle + Math.PI,
    };
}

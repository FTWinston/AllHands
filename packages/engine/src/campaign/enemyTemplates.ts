import { MAX_POWER_LEVEL } from 'common-data/features/ships/utils/systemEffectDefinitions';
import type { AiGoalInfo, AiShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import type { Position } from 'common-data/features/space/types/Position';
import type { IRandom } from 'common-data/types/IRandom';

export type EnemyRole = 'scout' | 'fighter' | 'heavy' | 'flagship';

const shieldCards = (count: number) => Array<'hullChargeShields'>(count).fill('hullChargeShields');
type ReactorCards = AiShipSetupInfo['reactor']['cards'];

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
    appearance: 'chevron',
    skill: 1,
    hull: system(shieldCards(12), 0),
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
        appearance: 'interceptor',
        hull: system(shieldCards(6), 0),
        reactor: system(reactorCards(2, 'reactorPowerTactical', 'reactorPowerHelm'), 0),
        helm: system(['zigZag', 'strafe', 'zigZag', 'slowAndSteady']),
        tactical: { ...system(['lowYield', 'lowYield', 'photonTorpedo']), numSlots: 1 },
        fleeThreshold: 0.4,
    },
    fighter: fighterTemplate,
    heavy: {
        ...fighterTemplate,
        appearance: 'spaceship',
        hull: system(shieldCards(16), 0),
        reactor: system(reactorCards(2, 'reactorPowerTactical', 'reactorPowerHull', 'reactorPowerEngineer'), 0),
        tactical: { ...system(['photonTorpedo', 'lowYield', 'fullSpread', 'photonTorpedo', 'lowYield']), numSlots: 2 },
        engineer: system(['auxPower', 'auxPower', 'distributePower', 'auxPower']),
        fleeThreshold: 0,
    },
    flagship: {
        ...fighterTemplate,
        appearance: 'apollo',
        hull: system(shieldCards(24), 0),
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

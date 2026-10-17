import type { AiGoalInfo, AiShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import type { Position } from 'common-data/features/space/types/Position';
import type { IRandom } from 'common-data/types/IRandom';

export type EnemyRole = 'scout' | 'fighter' | 'heavy' | 'flagship';

const shieldCards = (count: number) => Array<'hullChargeShields'>(count).fill('hullChargeShields');
const reactorCards = (sets: number) => Array(sets).fill(['reactorPowerHull', 'reactorPowerHelm', 'reactorPowerTactical', 'reactorPowerEngineer', 'reactorPowerScience', 'reactorPowerReactor']).flat() as AiShipSetupInfo['reactor']['cards'];

/** The original "An Enemy" ship from the old default scenario; all other roles are tweaks of it. */
const fighterTemplate: Omit<AiShipSetupInfo, 'name' | 'faction' | 'position' | 'goal'> = {
    appearance: 'chevron',
    skill: 1,
    hull: { cards: shieldCards(12), maxPowerLevel: 3, initialHandSize: 0 },
    reactor: { cards: reactorCards(2), maxPowerLevel: 5, initialHandSize: 0 },
    helm: { cards: ['slowAndSteady', 'zigZag', 'strafe', 'slowAndSteady'], maxPowerLevel: 3, initialHandSize: 1 },
    science: { cards: ['passiveScan', 'passiveScan', 'passiveScan', 'passiveScan', 'passiveScan'], maxPowerLevel: 2, initialHandSize: 1 },
    tactical: { numSlots: 1, cards: ['photonTorpedo', 'lowYield', 'fullSpread'], maxPowerLevel: 2, initialHandSize: 1 },
    engineer: { cards: ['auxPower', 'auxPower', 'distributePower'], maxPowerLevel: 2, initialHandSize: 1 },
};

const roleTemplates: Record<EnemyRole, Omit<AiShipSetupInfo, 'name' | 'faction' | 'position' | 'goal'>> = {
    scout: {
        ...fighterTemplate,
        appearance: 'interceptor',
        hull: { cards: shieldCards(6), maxPowerLevel: 2, initialHandSize: 0 },
        helm: { cards: ['zigZag', 'strafe', 'zigZag', 'slowAndSteady'], maxPowerLevel: 4, initialHandSize: 1 },
        tactical: { numSlots: 1, cards: ['lowYield', 'lowYield', 'photonTorpedo'], maxPowerLevel: 2, initialHandSize: 1 },
        fleeThreshold: 0.4,
    },
    fighter: fighterTemplate,
    heavy: {
        ...fighterTemplate,
        appearance: 'spaceship',
        hull: { cards: shieldCards(16), maxPowerLevel: 4, initialHandSize: 0 },
        tactical: { numSlots: 2, cards: ['photonTorpedo', 'lowYield', 'fullSpread', 'photonTorpedo', 'lowYield'], maxPowerLevel: 3, initialHandSize: 1 },
        engineer: { cards: ['auxPower', 'auxPower', 'distributePower', 'auxPower'], maxPowerLevel: 3, initialHandSize: 1 },
        fleeThreshold: 0,
    },
    flagship: {
        ...fighterTemplate,
        appearance: 'apollo',
        hull: { cards: shieldCards(24), maxPowerLevel: 5, initialHandSize: 0 },
        reactor: { cards: reactorCards(3), maxPowerLevel: 5, initialHandSize: 0 },
        helm: { cards: ['slowAndSteady', 'zigZag', 'strafe', 'slowAndSteady'], maxPowerLevel: 3, initialHandSize: 1 },
        science: { cards: ['passiveScan', 'passiveScan', 'passiveScan', 'passiveScan', 'passiveScan'], maxPowerLevel: 3, initialHandSize: 1 },
        tactical: { numSlots: 3, cards: ['photonTorpedo', 'lowYield', 'fullSpread', 'photonTorpedo', 'lowYield', 'fullSpread'], maxPowerLevel: 4, initialHandSize: 1 },
        engineer: { cards: ['auxPower', 'auxPower', 'distributePower', 'auxPower', 'distributePower'], maxPowerLevel: 4, initialHandSize: 1 },
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

import { MAX_POWER_LEVEL } from 'common-data/features/ships/utils/systemEffectDefinitions';
import type { AiGoalInfo, AiShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import type { Position } from 'common-data/features/space/types/Position';
import type { IRandom } from 'common-data/types/IRandom';

/** A kind of AI ship. Each has its own appearance, so the same shape always means the same kind of ship, whichever side it's on. */
export type ShipDesign = 'harrier' | 'fighter' | 'bulwark' | 'flagship' | 'clinicShip' | 'customsPlatform' | 'drone';

type ReactorCards = AiShipSetupInfo['reactor']['cards'];

/**
 * Each reactor card gives its system one level of baseline power (and makes it draw cards more often),
 * so a design's strengths come from the `extra` cards on top of the basic sets.
 */
const reactorCards = (sets: number, ...extra: ReactorCards) => [
    ...Array(sets).fill(['reactorPowerHull', 'reactorPowerHelm', 'reactorPowerTactical', 'reactorPowerEngineer', 'reactorPowerScience', 'reactorPowerReactor']).flat(),
    ...extra,
] as ReactorCards;

/** Systems aren't capped below the usual maximum: their power comes from the reactor deck. */
const system = <T extends string>(cards: T[], initialHandSize = 1) => ({ cards, maxPowerLevel: MAX_POWER_LEVEL, initialHandSize });

/*
    Hull cards make up the hull's health, and each emitter adds 15 shield capacity, and each volatile emitter 45.
    Emitters and tuning cards tune the shields when played. Bare hull cards do nothing but add health,
    so the more of them a hull has, the less of the time its shields are tuned.
*/

/** Everything about a ship that its design decides. The rest comes from the encounter that spawns it. */
type DesignTemplate = Omit<AiShipSetupInfo, 'name' | 'faction' | 'position' | 'goal' | 'skill'>;

/** The original "An Enemy" ship from the old default scenario; all other designs are tweaks of it. */
const fighterTemplate: DesignTemplate = {
    appearance: 'swallowtail-interceptor',
    // 60 shield capacity, sometimes tuned against energy weapons.
    hull: system(['hullShieldEmitter', 'hullShieldTuningEnergy', 'hullBare', 'hullShieldEmitter', 'hullShieldTuningEnergy', 'hullBare', 'hullShieldEmitter', 'hullShieldEmitter'], 0),
    // Loading a torpedo takes 3 tactical power.
    reactor: system(reactorCards(2, 'reactorPowerTactical'), 0),
    helm: system(['slowAndSteady', 'zigZag', 'strafe', 'slowAndSteady']),
    science: system(['passiveScan', 'passiveScan', 'passiveScan', 'passiveScan', 'passiveScan']),
    tactical: { ...system(['photonTorpedo', 'lowYield', 'fullSpread']), numSlots: 1 },
    engineer: system(['auxPower', 'auxPower', 'distributePower']),
};

const designTemplates: Record<ShipDesign, DesignTemplate> = {
    harrier: {
        ...fighterTemplate,
        appearance: 'dart-fighter',
        // A small shield (30), and a flimsy hull.
        hull: system(['hullShieldEmitter', 'hullShieldTuningEnergy', 'hullBare', 'hullShieldEmitter', 'hullBare'], 0),
        reactor: system(reactorCards(2, 'reactorPowerTactical', 'reactorPowerHelm'), 0),
        helm: system(['zigZag', 'strafe', 'zigZag', 'slowAndSteady']),
        tactical: { ...system(['lowYield', 'lowYield', 'photonTorpedo']), numSlots: 1 },
        fleeThreshold: 0.4,
    },
    fighter: fighterTemplate,
    bulwark: {
        ...fighterTemplate,
        appearance: 'hammerhead-cruiser',
        // A big shield (135), a third of it from a volatile emitter, sometimes tuned against torpedoes.
        hull: system([
            'hullShieldEmitter', 'hullVolatileEmitter', 'hullShieldTuningTorpedo', 'hullBare', 'hullShieldEmitter', 'hullShieldTuningTorpedo',
            'hullBare', 'hullShieldEmitter', 'hullBare', 'hullShieldEmitter', 'hullShieldEmitter', 'hullShieldEmitter',
        ], 0),
        reactor: system(reactorCards(2, 'reactorPowerTactical', 'reactorPowerHull', 'reactorPowerEngineer'), 0),
        tactical: { ...system(['photonTorpedo', 'lowYield', 'fullSpread', 'photonTorpedo', 'lowYield']), numSlots: 2 },
        engineer: system(['auxPower', 'auxPower', 'distributePower', 'auxPower']),
        fleeThreshold: 0,
    },
    flagship: {
        ...fighterTemplate,
        appearance: 'manta-command-ship',
        // The biggest shield (210), with two volatile emitters, sometimes tuned against energy weapons or torpedoes.
        hull: system([
            'hullShieldEmitter', 'hullVolatileEmitter', 'hullShieldTuningEnergy', 'hullShieldTuningTorpedo', 'hullBare', 'hullShieldEmitter', 'hullVolatileEmitter', 'hullShieldTuningEnergy',
            'hullShieldTuningTorpedo', 'hullBare', 'hullShieldEmitter', 'hullShieldEmitter', 'hullShieldEmitter', 'hullShieldEmitter', 'hullShieldEmitter', 'hullShieldEmitter',
        ], 0),
        reactor: system(reactorCards(3, 'reactorPowerTactical', 'reactorPowerHull'), 0),
        tactical: { ...system(['photonTorpedo', 'lowYield', 'fullSpread', 'photonTorpedo', 'lowYield', 'fullSpread']), numSlots: 3 },
        engineer: system(['auxPower', 'auxPower', 'distributePower', 'auxPower', 'distributePower']),
        fleeThreshold: 0,
    },
    // Not a warship: slow, with one short-range gun, and nothing to speak of under its shields (75). Those are fully powered, as they're all it has.
    clinicShip: {
        ...fighterTemplate,
        appearance: 'ring-spine-tender',
        hull: system(['hullShieldEmitter', 'hullBare', 'hullShieldEmitter', 'hullBare', 'hullShieldEmitter', 'hullShieldEmitter', 'hullShieldEmitter'], 0),
        reactor: system(reactorCards(2, 'reactorPowerHull', 'reactorPowerHull', 'reactorPowerHull'), 0),
        helm: system(['slowAndSteady', 'slowAndSteady', 'slowAndSteady', 'slowAndSteady']),
        tactical: { ...system(['phaserStrip', 'lowYield', 'phaserStrip']), numSlots: 1 },
        fleeThreshold: 0,
    },
    // It stays where it was built: all its helm can do is turn to face things. Its shields (90) are fully powered, and there's a lot of bare hull under them,
    // so it can take a few hits after they've gone. It never leaves. Whoever spawns one decides what it's armed with.
    customsPlatform: {
        ...fighterTemplate,
        appearance: 'diamond-monitor',
        hull: system([
            'hullShieldEmitter', 'hullShieldTuningEnergy', 'hullShieldTuningTorpedo', 'hullBare', 'hullShieldEmitter', 'hullBare', 'hullShieldEmitter', 'hullBare',
            'hullShieldEmitter', 'hullBare', 'hullShieldEmitter', 'hullBare', 'hullShieldEmitter', 'hullBare', ...Array<'hullBare'>(54).fill('hullBare'),
        ], 0),
        reactor: system(reactorCards(2, 'reactorPowerHull', 'reactorPowerHull', 'reactorPowerHull', 'reactorPowerTactical'), 0),
        helm: system(['faceTarget', 'faceTarget', 'faceTarget']),
        tactical: { ...system(['phaserCannon', 'photonTorpedo', 'phaserCannon', 'photonTorpedo']), numSlots: 2 },
        fleeThreshold: 0,
    },
    // A harrier with half the hull, and nobody aboard to think better of it.
    drone: {
        ...fighterTemplate,
        appearance: 'mantis-drone',
        hull: system(['hullShieldEmitter', 'hullBare', 'hullBare'], 0),
        reactor: system(reactorCards(2, 'reactorPowerTactical', 'reactorPowerHelm'), 0),
        helm: system(['zigZag', 'strafe', 'zigZag', 'slowAndSteady']),
        tactical: { ...system(['lowYield', 'lowYield', 'photonTorpedo']), numSlots: 1 },
        fleeThreshold: 0,
    },
};

/** What a ship of each design is called, unless the encounter names it. */
const designNames: Record<ShipDesign, string> = {
    harrier: 'Harrier',
    fighter: 'Fighter',
    bulwark: 'Heavy Cruiser',
    flagship: 'Flagship',
    clinicShip: 'Clinic Ship',
    customsPlatform: 'Customs Platform',
    drone: 'Drone',
};

/** How well a ship plays (see `AiShipSetupInfo.skill`), unless the encounter says otherwise. */
export const defaultSkill = 0.8;

export interface ShipSetupOptions {
    scenarioId?: string;
    goal?: AiGoalInfo;
    name?: string;
    skill?: number;
}

/** The setup for a ship of the given design, on one of the sides that the encounter spawning it declares (see `Encounter.sides`). */
export function createShipSetup(design: ShipDesign, side: string, position: Position, options: ShipSetupOptions = {}): AiShipSetupInfo {
    return {
        ...designTemplates[design],
        name: options.name ?? designNames[design],
        faction: side,
        position,
        goal: options.goal ?? { type: 'search-and-destroy' },
        skill: options.skill ?? defaultSkill,
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

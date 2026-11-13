import { MAX_POWER_LEVEL } from 'common-data/features/ships/utils/systemEffectDefinitions';
import type { AiGoalInfo, AiPriorities, AiShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import type { ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';
import type { Position } from 'common-data/features/space/types/Position';
import type { IRandom } from 'common-data/types/IRandom';

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
export type DesignTemplate = Omit<AiShipSetupInfo, 'name' | 'faction' | 'position' | 'goal' | 'skill'>;

/** Every officer switched off: nobody aboard plays a card, moves, turns, shoots or repairs. */
export const inertPriorities: Required<AiPriorities> = { helm: 0, tactical: 0, science: 0, engineer: 0 };

/**
 * A ship that does nothing: an object an encounter needs, such as a module or a relay, given a hull to scan and shoot, a name and a faction.
 * Nobody aboard acts, and its reactor deck is empty, so nothing is ever drawn or played, and every system's power is 0.
 * Each crew system has one card that never leaves the deck, so it's put out by one card's damage. Its hull is what matters.
 * It never moves by itself: an encounter that wants it moved sets its motion.
 */
export function inertTemplate(appearance: ObjectAppearance, hull: AiShipSetupInfo['hull']['cards']): DesignTemplate {
    const one = <T extends string>(card: T) => system([card], 0);

    return {
        appearance,
        hull: system(hull, 0),
        reactor: system([] as ReactorCards, 0),
        helm: one('slowAndSteady'),
        science: one('passiveScan'),
        tactical: { ...one('phaserStrip'), numSlots: 1 },
        engineer: one('distributePower'),
        fleeThreshold: 0,
        priorities: inertPriorities,
    };
}

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

// Enforce that values are design templates, without widening the key type to "string".
function defineDesignTemplates<T extends Record<string, DesignTemplate>>(templates: T) {
    return templates;
}

const designTemplates = defineDesignTemplates({
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
    // Not a warship: every system at 2, five cards in each crew system, and a strip for a gun. Its reactor runs at 3, so it draws often enough for that gun to be a threat.
    // Its shields (60) are over 12 bare hull, and those come first, so hits to the hull don't cost it shield capacity until it's nearly gone. It never runs.
    hauler: {
        ...fighterTemplate,
        appearance: 'armed-freighter',
        hull: system([...Array<'hullBare'>(12).fill('hullBare'), 'hullShieldEmitter', 'hullShieldEmitter', 'hullShieldEmitter', 'hullShieldEmitter'], 0),
        reactor: system(reactorCards(2, 'reactorPowerReactor'), 0),
        helm: system(['slowAndSteady', 'slowAndSteady', 'slowAndSteady', 'strafe', 'faceTarget']),
        science: system(['passiveScan', 'passiveScan', 'passiveScan', 'passiveScan', 'passiveScan']),
        tactical: { ...system(['phaserStrip', 'phaserStrip', 'phaserStrip', 'phaserStrip', 'phaserStrip']), numSlots: 1 },
        engineer: system(['distributePower', 'distributePower', 'distributePower', 'drawPower', 'drawPower']),
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
    // A working boat, with a strip for a gun. Every helm card is Slow and Steady, and there are a dozen, so its engines take several hits to put out.
    // Its shields (30) are over 18 bare hull, which come first. Its engineer is switched off, so nothing aboard repairs anything. It never runs.
    tug: {
        ...fighterTemplate,
        appearance: 'tug-and-tow',
        hull: system([...Array<'hullBare'>(18).fill('hullBare'), 'hullShieldEmitter', 'hullShieldEmitter'], 0),
        reactor: system(reactorCards(2), 0),
        helm: system(Array<'slowAndSteady'>(12).fill('slowAndSteady')),
        tactical: { ...system(['phaserStrip', 'phaserStrip']), numSlots: 1 },
        fleeThreshold: 0,
        priorities: { engineer: 0 },
    },
    // Not a ship at all: a station module, with nobody aboard and nothing to power it, so all it has is 40 bare hull and no shields. Whoever has it moves it.
    waterModule: inertTemplate('mining-barge', Array<'hullBare'>(40).fill('hullBare')),
    // Not a ship either: a mining station that's being abandoned, with nobody left at the controls. 30 bare hull and no shields.
    miningStation: inertTemplate('drydock-tender', Array<'hullBare'>(30).fill('hullBare')),
    // An unarmed evacuation shuttle: all it can do is fly straight. Its shields (15) are fully powered, over 3 bare hull, which come first,
    // so it survives one cannon hit and not a second. Nobody aboard shoots or scans. It never runs.
    shuttle: {
        ...fighterTemplate,
        appearance: 'ring-courier',
        hull: system(['hullBare', 'hullBare', 'hullBare', 'hullShieldEmitter'], 0),
        reactor: system(reactorCards(2, 'reactorPowerHull', 'reactorPowerHull'), 0),
        helm: system(['slowAndSteady', 'slowAndSteady', 'slowAndSteady', 'slowAndSteady']),
        tactical: { ...system(['phaserStrip']), numSlots: 1 },
        fleeThreshold: 0,
        priorities: { tactical: 0, science: 0 },
    },
    // A piece of an old defence grid, with a cannon. Its shields (15) are over 2 bare hull, which come first. Its reactor gives tactical 3, which a cannon needs.
    // Whoever spawns one decides whether its gun still works, by switching its tactical officer off. It never runs.
    gridFragment: {
        ...fighterTemplate,
        appearance: 'sentry-drone',
        hull: system(['hullBare', 'hullBare', 'hullShieldEmitter'], 0),
        helm: system(['zigZag', 'strafe', 'slowAndSteady', 'slowAndSteady']),
        tactical: { ...system(['phaserCannon', 'phaserCannon', 'phaserCannon']), numSlots: 1 },
        fleeThreshold: 0,
    },
});

/** A kind of AI ship. Each has its own appearance, so the same shape always means the same kind of ship, whichever faction it's in. */
export type ShipDesign = keyof typeof designTemplates;

/** What a ship of each design is called, unless the encounter names it. */
const designNames: Record<ShipDesign, string> = {
    harrier: 'Harrier',
    fighter: 'Fighter',
    bulwark: 'Heavy Cruiser',
    flagship: 'Flagship',
    clinicShip: 'Clinic Ship',
    customsPlatform: 'Customs Platform',
    hauler: 'Hauler',
    drone: 'Drone',
    tug: 'Tug',
    waterModule: 'Water Module',
    miningStation: 'Mining Station',
    shuttle: 'Shuttle',
    gridFragment: 'Grid Fragment',
};

/** How well a ship plays (see `AiShipSetupInfo.skill`), unless the encounter says otherwise. */
export const defaultSkill = 0.8;

export interface ShipSetupOptions {
    scenarioId?: string;
    goal?: AiGoalInfo;
    name?: string;
    skill?: number;
    /** Officers' priorities to use in place of the design's, such as 0 to switch one officer off on this one ship. Those it leaves out are the design's. */
    priorities?: AiPriorities;
}

/** The setup for a ship of the given design, in one of the factions that the encounter spawning it declares (see `Encounter.factions`). */
export function createShipSetup(design: ShipDesign, faction: string, position: Position, options: ShipSetupOptions = {}): AiShipSetupInfo {
    const template: DesignTemplate = designTemplates[design];

    return {
        ...template,
        name: options.name ?? designNames[design],
        faction,
        position,
        goal: options.goal ?? { type: 'search-and-destroy' },
        skill: options.skill ?? defaultSkill,
        ...(options.scenarioId !== undefined ? { id: options.scenarioId } : {}),
        ...(options.priorities !== undefined ? { priorities: { ...template.priorities, ...options.priorities } } : {}),
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

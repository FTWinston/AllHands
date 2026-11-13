import { MAX_POWER_LEVEL } from 'common-data/features/ships/utils/powerLevel';
import type { AiGoalInfo, AiPriorities, AiShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import type { ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';
import type { Position } from 'common-data/features/space/types/Position';
import type { IRandom } from 'common-data/types/IRandom';
import type { engineContent } from 'content/content.engine';
import type { ShipDesignDefinition } from 'src/content/EngineContent';

type ReactorCards = AiShipSetupInfo['reactor']['cards'];

/**
 * Each reactor card gives its system one level of baseline power (and makes it draw cards more often),
 * so a design's strengths come from the `extra` cards on top of the basic sets.
 */
export const reactorCards = (sets: number, ...extra: ReactorCards) => [
    ...Array(sets).fill(['reactorPowerHull', 'reactorPowerHelm', 'reactorPowerTactical', 'reactorPowerEngineer', 'reactorPowerScience', 'reactorPowerReactor']).flat(),
    ...extra,
] as ReactorCards;

/** Systems aren't capped below the usual maximum: their power comes from the reactor deck. */
export const system = <T extends string>(cards: T[], initialHandSize = 1) => ({ cards, maxPowerLevel: MAX_POWER_LEVEL, initialHandSize });

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

type DesignKeys<TDesigns> = TDesigns extends unknown ? keyof TDesigns : never;

/** A kind of AI ship. Each has its own appearance, so the same shape always means the same kind of ship, whichever faction it's in. Each is defined in the content folder that uses it. */
export type ShipDesign = Extract<DesignKeys<(typeof engineContent)[number]['designs']>, string>;

/** Every registered ship design. Filled by `registerEngineContent`. */
const designs = new Map<string, ShipDesignDefinition>();

/** Register the given ship designs. */
export function registerDesigns(definitions: Readonly<Record<string, ShipDesignDefinition>>) {
    for (const [design, definition] of Object.entries(definitions)) {
        if (designs.has(design)) {
            throw new Error(`Ship design registered twice: ${design}`);
        }
        designs.set(design, definition);
    }
}

/** Every registered ship design's name. */
export function getShipDesigns(): ShipDesign[] {
    return [...designs.keys()] as ShipDesign[];
}

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
    const template = designs.get(design);
    if (!template) {
        throw new Error(`Ship design not found: ${design}`);
    }

    return {
        ...template,
        name: options.name ?? template.name,
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

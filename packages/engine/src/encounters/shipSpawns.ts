import { createShipSetup, ringPosition, type ShipDesign } from '../campaign/shipDesigns';
import { AiShip } from '../state/AiShip';
import type { AiGoalInfo, AiPriorities } from 'common-data/features/space/types/GameObjectInfo';
import type { Position } from 'common-data/features/space/types/Position';
import type { GameState } from 'src/state/GameState';

/** An AI ship for an encounter to spawn, on whichever side it's put. */
export interface ShipSpawn {
    design: ShipDesign;
    /** Gives the ship a scenario id, so others can reference it. */
    scenarioId?: string;
    /** Makes the ship guard the ship with this scenario id instead of hunting the player. */
    guards?: string;
    /** What the ship is there to do, if not to hunt (or to guard, see `guards`). */
    goal?: AiGoalInfo;
    name?: string;
    /** Where the ship starts. Left out, it's spread around the player with the rest. */
    position?: Position;
    skill?: number;
    /** Officers' priorities in place of the design's, such as 0 to switch one officer off on this ship. Those it leaves out are the design's. */
    priorities?: AiPriorities;
}

/**
 * Creates the given ships, in one faction, without adding them to the game (see `Encounter.spawnShips`, which does both).
 * Those without a position are evenly spread around the player, starting from a random bearing.
 */
export function createShips(state: GameState, faction: string, spawns: readonly ShipSpawn[]): AiShip[] {
    const startAngle = state.random.getFloat(0, Math.PI * 2);

    return spawns.map((spawn, index) => new AiShip(state, createShipSetup(
        spawn.design,
        faction,
        spawn.position ?? ringPosition(state.random, startAngle + (index * Math.PI * 2) / spawns.length),
        {
            scenarioId: spawn.scenarioId,
            name: spawn.name,
            goal: spawn.guards ? { type: 'guard-ship', shipId: spawn.guards } : spawn.goal,
            skill: spawn.skill,
            priorities: spawn.priorities,
        }
    )));
}

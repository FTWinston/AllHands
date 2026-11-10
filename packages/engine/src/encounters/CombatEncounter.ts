import { hostileToPlayer } from '../campaign/factions';
import { createShipSetup, ringPosition, type ShipDesign } from '../campaign/shipDesigns';
import { AiShip } from '../state/AiShip';
import { getHostileShips } from '../utils/shipQueries';
import { Encounter } from './Encounter';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { AiGoalInfo } from 'common-data/features/space/types/GameObjectInfo';
import type { Position } from 'common-data/features/space/types/Position';
import type { GameObject } from 'src/state/GameObject';
import type { GameState } from 'src/state/GameState';

export interface EnemySpawn {
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
}

/** The one side in an encounter that is nothing but a fight: whoever the player ships are up against. */
export const hostileSide = 'hostiles';

/** Spawns the given ships on one side. Those without a position are evenly spread around the player, starting from a random bearing. */
export function spawnEnemies(state: GameState, side: string, spawns: readonly EnemySpawn[]): AiShip[] {
    const startAngle = state.random.getFloat(0, Math.PI * 2);

    return spawns.map((spawn, index) => new AiShip(state, createShipSetup(
        spawn.design,
        side,
        spawn.position ?? ringPosition(state.random, startAngle + (index * Math.PI * 2) / spawns.length),
        {
            scenarioId: spawn.scenarioId,
            name: spawn.name,
            goal: spawn.guards ? { type: 'guard-ship', shipId: spawn.guards } : spawn.goal,
            skill: spawn.skill,
        }
    )));
}

/** What an elite encounter brings on top of its usual enemies. */
export const eliteReinforcements: readonly EnemySpawn[] = [{ design: 'bulwark' }];

/** The spawns for a node: elite nodes add `eliteReinforcements`. */
export function withEliteReinforcements(node: SectorNodeInfo, spawns: readonly EnemySpawn[]): readonly EnemySpawn[] {
    return node.elite ? [...spawns, ...eliteReinforcements] : spawns;
}

/** True when no hostile ships remain in the game state: every one has been destroyed, or has left (see `AiShip.depart`). */
export function noHostilesRemain(state: GameState): boolean {
    return getHostileShips(state).length === 0;
}

/** A fixed set of enemies that must all be destroyed or driven off; subclasses only differ in composition. */
export abstract class CombatEncounter extends Encounter {
    protected override readonly sides = [hostileToPlayer(hostileSide)];
    protected abstract readonly composition: readonly EnemySpawn[];

    constructor(state: GameState, node: SectorNodeInfo) {
        super(state, { ...node, objective: { type: 'clear' } });
    }

    protected populate(): void {
        this.spawnObjects(spawnEnemies(this.state, hostileSide, withEliteReinforcements(this.node, this.composition)));
    }

    override start(): void {
        super.start();
        this.checkComplete();
    }

    override onObjectRemoved(_object: GameObject): void {
        this.checkComplete();
    }

    private checkComplete(): void {
        if (noHostilesRemain(this.state)) {
            this.complete();
        }
    }
}

/** A fighter backed by a harrier. */
export class SkirmishEncounter extends CombatEncounter {
    protected readonly composition: readonly EnemySpawn[] = [{ design: 'fighter' }, { design: 'harrier' }];
}

/** Three harriers converging from different bearings. */
export class AmbushEncounter extends CombatEncounter {
    protected readonly composition: readonly EnemySpawn[] = [{ design: 'harrier' }, { design: 'harrier' }, { design: 'harrier' }];
}

/** A heavy cruiser with a fighter. */
export class AssaultEncounter extends CombatEncounter {
    protected readonly composition: readonly EnemySpawn[] = [{ design: 'bulwark' }, { design: 'fighter' }];
}

/** A heavy cruiser escorted by two harriers, who stop guarding it (and hunt) once it dies. */
export class EscortEncounter extends CombatEncounter {
    protected readonly composition: readonly EnemySpawn[] = [
        { design: 'bulwark', scenarioId: 'escortLeader' },
        { design: 'harrier', guards: 'escortLeader' },
        { design: 'harrier', guards: 'escortLeader' },
    ];
}

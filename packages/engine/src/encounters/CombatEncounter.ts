import { createEnemySetup, ringPosition, type EnemyRole } from '../campaign/enemyTemplates';
import { AiShip } from '../state/AiShip';
import { Encounter } from './Encounter';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { GameState } from 'src/state/GameState';

export interface EnemySpawn {
    role: EnemyRole;
    /** Gives the ship a scenario id, so others can reference it. */
    scenarioId?: string;
    /** Makes the ship guard the ship with this scenario id instead of hunting the player. */
    guards?: string;
    name?: string;
}

/** Spawns the given enemies evenly spread around the player, starting from a random bearing. */
export function spawnEnemies(state: GameState, factionId: string, spawns: readonly EnemySpawn[]): AiShip[] {
    const startAngle = state.random.getFloat(0, Math.PI * 2);

    return spawns.map((spawn, index) => new AiShip(state, createEnemySetup(
        spawn.role,
        factionId,
        ringPosition(state.random, startAngle + (index * Math.PI * 2) / spawns.length),
        {
            scenarioId: spawn.scenarioId,
            name: spawn.name,
            goal: spawn.guards ? { type: 'guard-ship', shipId: spawn.guards } : undefined,
        }
    )));
}

/** A fixed set of enemies that must all be destroyed; subclasses only differ in composition. */
export abstract class CombatEncounter extends Encounter {
    protected abstract readonly composition: readonly EnemySpawn[];

    constructor(state: GameState, node: SectorNodeInfo) {
        super(state, { ...node, objective: { type: 'destroyAll' } });
    }

    protected populate(): void {
        this.spawnObjects(spawnEnemies(this.state, this.factionId, this.composition));
    }
}

/** A fighter backed by a scout. */
export class SkirmishEncounter extends CombatEncounter {
    protected readonly composition: readonly EnemySpawn[] = [{ role: 'fighter' }, { role: 'scout' }];
}

/** Three scouts converging from different bearings. */
export class AmbushEncounter extends CombatEncounter {
    protected readonly composition: readonly EnemySpawn[] = [{ role: 'scout' }, { role: 'scout' }, { role: 'scout' }];
}

/** A heavy cruiser with a fighter. */
export class AssaultEncounter extends CombatEncounter {
    protected readonly composition: readonly EnemySpawn[] = [{ role: 'heavy' }, { role: 'fighter' }];
}

/** A heavy cruiser escorted by two scouts, who stop guarding it (and hunt) once it dies. */
export class EscortEncounter extends CombatEncounter {
    protected readonly composition: readonly EnemySpawn[] = [
        { role: 'heavy', scenarioId: 'escortLeader' },
        { role: 'scout', guards: 'escortLeader' },
        { role: 'scout', guards: 'escortLeader' },
    ];
}

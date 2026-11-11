import { hostileToPlayer } from '../campaign/factions';
import { getHostileShips } from '../utils/shipQueries';
import { Encounter } from './Encounter';
import type { EncounterDefinition } from './EncounterDefinition';
import type { ShipSpawn } from './shipSpawns';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { GameState } from 'src/state/GameState';

/** The one faction in an encounter that is nothing but a fight: whoever the player ships are up against. */
export const hostileFaction = 'hostiles';

/** What an elite encounter brings on top of its usual enemies. */
export const eliteReinforcements: readonly ShipSpawn[] = [{ design: 'bulwark' }];

/** The spawns for a node: elite nodes add `eliteReinforcements`. */
export function withEliteReinforcements(node: SectorNodeInfo, spawns: readonly ShipSpawn[]): readonly ShipSpawn[] {
    return node.elite ? [...spawns, ...eliteReinforcements] : spawns;
}

/** True when no hostile ships remain in the game state: every one has been destroyed, or has left (see `AiShip.depart`). */
export function noHostilesRemain(state: GameState): boolean {
    return getHostileShips(state).length === 0;
}

/** A fixed set of enemies that must all be destroyed or driven off; subclasses only differ in composition. */
export abstract class CombatEncounter extends Encounter {
    protected override readonly factions = [hostileToPlayer(hostileFaction)];
    protected abstract readonly composition: readonly ShipSpawn[];

    protected populate(): void {
        this.spawnShips(hostileFaction, withEliteReinforcements(this.node, this.composition));
    }

    override start(): void {
        super.start();
        this.checkComplete();
    }

    protected override onObjectRemoved(): void {
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
    protected readonly composition: readonly ShipSpawn[] = [{ design: 'fighter' }, { design: 'harrier' }];
}

/** Three harriers converging from different bearings. */
export class AmbushEncounter extends CombatEncounter {
    protected readonly composition: readonly ShipSpawn[] = [{ design: 'harrier' }, { design: 'harrier' }, { design: 'harrier' }];
}

/** A heavy cruiser with a fighter. */
export class AssaultEncounter extends CombatEncounter {
    protected readonly composition: readonly ShipSpawn[] = [{ design: 'bulwark' }, { design: 'fighter' }];
}

/** A heavy cruiser escorted by two harriers, who stop guarding it (and hunt) once it dies. */
export class EscortEncounter extends CombatEncounter {
    protected readonly composition: readonly ShipSpawn[] = [
        { design: 'bulwark', scenarioId: 'escortLeader' },
        { design: 'harrier', guards: 'escortLeader' },
        { design: 'harrier', guards: 'escortLeader' },
    ];
}

/** The placeholder fights, which every sector has for now. */
export const combatEncounterDefinitions: readonly EncounterDefinition[] = [
    { id: 'skirmish', name: 'Skirmish', kind: 'combat', objective: { type: 'clear' }, defaultEnvironment: 'deepSpace', create: (state, node) => new SkirmishEncounter(state, node) },
    { id: 'ambush', name: 'Ambush', kind: 'combat', objective: { type: 'clear' }, defaultEnvironment: 'asteroidField', create: (state, node) => new AmbushEncounter(state, node) },
    { id: 'assault', name: 'Assault', kind: 'combat', objective: { type: 'clear' }, defaultEnvironment: 'nebula', create: (state, node) => new AssaultEncounter(state, node) },
    { id: 'escort', name: 'Escorted Cruiser', kind: 'combat', objective: { type: 'clear' }, defaultEnvironment: 'gasGiant', create: (state, node) => new EscortEncounter(state, node) },
];

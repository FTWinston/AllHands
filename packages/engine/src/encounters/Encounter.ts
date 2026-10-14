import { createObjective } from './objectives/createObjective';
import type { Objective } from './objectives/Objective';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { GameObject } from 'src/state/GameObject';
import type { GameState } from 'src/state/GameState';

/** The faction used when a node does not name one (e.g. standalone dev launches). */
export const defaultEnemyFactionId = 'raiders';

/**
 * One node's worth of gameplay: spawns what it needs, tracks its objective, and reports completion.
 * The `Campaign` owns the lifecycle (start, tick, removal notifications, dispose) and the environment
 * is purely informational (it is carried to clients through the encounter summary).
 */
export abstract class Encounter {
    protected readonly objective: Objective | null;

    constructor(protected readonly state: GameState, public readonly node: SectorNodeInfo) {
        this.objective = node.objective ? createObjective(node.objective, state) : null;
    }

    get factionId(): string {
        return this.node.factionId ?? defaultEnemyFactionId;
    }

    /** True once the objective is met; always true for encounters without an objective. */
    get isComplete(): boolean {
        return this.objective?.isMet ?? true;
    }

    /** Game time (ms) at which a timed objective completes, or 0. */
    get objectiveEndTime(): number {
        return this.objective?.endTime ?? 0;
    }

    start(): void {
        this.populate();
        this.objective?.start();
    }

    tick(deltaTime: number): void {
        this.objective?.tick(deltaTime);
    }

    onObjectRemoved(object: GameObject): void {
        this.objective?.onObjectRemoved(object);
    }

    dispose(): void {
        this.objective?.dispose();
    }

    /** Creates the encounter's initial objects. */
    protected abstract populate(): void;

    /**
     * Adds a batch of newly-created objects to the game state, then resolves any scenario-authored
     * references between them (e.g. a `guard-ship` goal naming another object in the same batch by
     * `scenarioId`) — see `GameObject.resolveScenarioReferences`. Resolution happens only after every
     * object in the batch has been added, so references work regardless of array order. Use this
     * instead of calling `state.add` directly for any objects built from setup info.
     */
    protected spawnObjects(objects: readonly GameObject[]): void {
        for (const object of objects) {
            this.state.add(object);
        }

        for (const object of objects) {
            object.resolveScenarioReferences();
        }
    }
}

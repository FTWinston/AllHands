import { ListenableEvent } from 'src/classes/ListenableEvent';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { GameObject } from 'src/state/GameObject';
import type { GameState } from 'src/state/GameState';

/** The faction used when a node does not name one (e.g. standalone dev launches). */
export const defaultEnemyFactionId = 'factionA';

/**
 * One node's worth of gameplay: spawns what it needs, decides when its objective is met, and reports
 * completion via `onComplete`. The `Campaign` owns the lifecycle (start, tick, removal notifications)
 * and the environment is purely informational (it is carried to clients through the encounter summary).
 */
export abstract class Encounter {
    private _isComplete = false;

    /** Fired once, when the encounter becomes complete. */
    readonly onComplete = new ListenableEvent();

    constructor(protected readonly state: GameState, public readonly node: SectorNodeInfo) {}

    get factionId(): string {
        return this.node.factionId ?? defaultEnemyFactionId;
    }

    /** True once the encounter's objective has been met. */
    get isComplete(): boolean {
        return this._isComplete;
    }

    /** Game time (ms) at which a timed objective completes, or 0. */
    get objectiveEndTime(): number {
        return 0;
    }

    /** Spawns the encounter's objects. Subclasses override this to also evaluate their objective. */
    start(): void {
        this.populate();
    }

    /** Dev tools: starts the encounter as though its objective had already been met, without spawning anything. */
    startComplete(): void {
        this.complete();
    }

    tick(_deltaTime: number): void {}

    onObjectRemoved(_object: GameObject): void {}

    /** Marks the encounter complete and fires `onComplete`; does nothing if already complete. */
    protected complete(): void {
        if (this._isComplete) {
            return;
        }

        this._isComplete = true;
        this.onComplete.triggerListeners();
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

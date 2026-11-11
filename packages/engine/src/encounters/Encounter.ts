import { ListenableEvent } from 'src/classes/ListenableEvent';
import type { EncounterOutcome } from 'common-data/features/sectors/types/ObjectiveInfo';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { FactionConfig } from 'common-data/features/space/types/FactionConfig';
import type { GameObject } from 'src/state/GameObject';
import type { GameState } from 'src/state/GameState';
import type { RemovalReason } from 'src/types/RemovalReason';

/**
 * One node's worth of gameplay: spawns what it needs, decides when its objective is met or failed, and reports
 * that via `onComplete`. The `Campaign` owns the lifecycle (start, tick, removal notifications)
 * and the environment is purely informational (it is carried to clients through the encounter summary).
 */
export abstract class Encounter {
    private _outcome: EncounterOutcome | null = null;
    private _score = 1;

    /** Fired once, when the encounter becomes complete. */
    readonly onComplete = new ListenableEvent();

    constructor(protected readonly state: GameState, public readonly node: SectorNodeInfo) {}

    /**
     * Everyone here other than the player ships, and how they relate to each other and to the player faction (see `playerFactionId`).
     * They only exist for as long as the encounter does: nothing relates to anything else from one encounter to the next.
     */
    protected readonly sides: readonly FactionConfig[] = [];

    /** True once the encounter's objective has been met or failed. */
    get isComplete(): boolean {
        return this._outcome !== null;
    }

    /** Whether the objective was met or failed, or null while the encounter is still undecided. */
    get outcome(): EncounterOutcome | null {
        return this._outcome;
    }

    /** How well a completed encounter went, from 0 to 1. Always 1 unless it's one that grades its outcome. */
    get score(): number {
        return this._score;
    }

    /** Game time (ms) at which a timed objective completes, or 0. */
    get objectiveEndTime(): number {
        return 0;
    }

    /** Declares the encounter's sides and spawns its objects. Subclasses override this to also evaluate their objective. */
    start(): void {
        this.state.factionRegistry.setEncounterSides(this.sides);
        this.populate();
    }

    /** Dev tools: starts the encounter as though its objective had already been met, without spawning anything. */
    startComplete(): void {
        this.complete();
    }

    tick(_deltaTime: number): void {}

    onObjectRemoved(_object: GameObject, _reason: RemovalReason): void {}

    /** Marks the encounter complete and fires `onComplete`; does nothing if already complete. Only encounters that grade their outcome pass a score. */
    protected complete(outcome: EncounterOutcome = 'success', score = 1): void {
        if (this._outcome !== null) {
            return;
        }

        this._outcome = outcome;
        this._score = Math.max(0, Math.min(1, score));
        this.onComplete.triggerListeners();
    }

    /**
     * Has someone say something over comms, which the viewscreen shows for a while. It replaces anything already being said.
     * This is how the people here get a voice, and how the crew hears things it can't see for itself, like how an ally is doing.
     */
    protected hail(speaker: string, text: string): void {
        this.state.showHail(speaker, text);
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

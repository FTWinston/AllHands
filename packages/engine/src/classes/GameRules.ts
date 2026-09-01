import type { GameObject } from '../state/GameObject';
import type { GameState } from '../state/GameState';
import type { ScenarioConfig } from 'common-data/types/ScenarioConfig';

export abstract class GameRules {
    constructor(
        protected readonly state: GameState,
        protected readonly scenario: ScenarioConfig
    ) {}

    /**
     * Set up initial encounters/enemies.
     * Called after player ships have been created and assigned to crews.
     */
    abstract populate(): void;

    /**
     * React to a game object being removed/destroyed.
     */
    abstract onObjectRemoved(object: GameObject): void;

    /**
     * Per-tick update for rule-specific logic.
     */
    tick(_deltaTime: number): void {}

    /**
     * Adds a batch of newly-created objects to the game state, then resolves any
     * scenario-authored references between them (e.g. a `guard-ship` goal naming another
     * object in the same batch by `scenarioId`) — see `GameObject.resolveScenarioReferences`.
     * Resolution happens only after every object in the batch has been added, so references
     * work regardless of array order. Use this instead of calling `state.add` directly for
     * any objects built from scenario setup info.
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

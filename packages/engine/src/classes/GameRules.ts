import type { ScenarioConfig } from 'common-data/types/ScenarioConfig';
import type { GameObject } from '../state/GameObject';
import type { GameState } from '../state/GameState';

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
}

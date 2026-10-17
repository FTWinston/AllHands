import type { GameObject } from 'src/state/GameObject';
import type { GameState } from 'src/state/GameState';

/** A win condition for an encounter; add a new `ObjectiveInfo` type by subclassing this and extending `createObjective`. */
export abstract class Objective {
    constructor(protected readonly state: GameState) {}

    /** Whether the objective has been met; subclasses set this when they tick or see an object removed. */
    isMet = false;

    /** Game time (ms) when a timed objective completes; 0 when not timed. */
    get endTime(): number {
        return 0;
    }

    /** Called once the encounter has spawned its objects. */
    start(): void {}

    tick(_deltaTime: number): void {}

    onObjectRemoved(_object: GameObject): void {}

    dispose(): void {}
}

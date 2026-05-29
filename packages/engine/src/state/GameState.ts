import { Schema, type, MapSchema, view } from '@colyseus/schema';
import { ClockTimer } from '@colyseus/timer';
import { Random } from 'common-data/classes/Random';
import { IRandom } from 'common-data/types/IRandom';
import { IdProvider } from 'src/types/IdProvider';
import { GameStatus } from '../types/GameStatus';
import { CrewState } from './CrewState';
import { GameObject } from './GameObject';
import type { GameRules } from '../classes/GameRules';

export class GameState extends Schema {
    @type('string') gameStatus: GameStatus = 'setup';
    @view() @type({ map: GameObject }) objects = new MapSchema<GameObject>();
    @view() @type({ map: CrewState }) crews = new MapSchema<CrewState>();
    public readonly random: IRandom;
    public rules: GameRules | null = null;

    /** The current scaled game time, in milliseconds. Use this instead of clock.currentTime for all game logic. */
    public currentTime: number;

    /** Multiplier applied to all time-dependent logic. A value of 2 makes everything run twice as fast. */
    public timeScale: number;

    constructor(private readonly idPool: IdProvider, public readonly clock: ClockTimer, timeScale: number = 1) {
        super();
        this.random = new Random(Math.random);
        this.currentTime = clock.currentTime;
        this.timeScale = timeScale;
    }

    public getNewId(): string {
        return this.idPool.getId();
    }

    public add(object: GameObject) {
        this.objects.set(object.id, object);
    }

    public remove(object: GameObject) {
        this.objects.delete(object.id);

        if (this.gameStatus === 'active') {
            // Remove object from all crew client views.
            for (const crew of this.crews.values()) {
                crew.removeObjectFromViews(object);
            }
        }

        this.idPool.releaseId(object.id);

        this.rules?.onObjectRemoved(object);
    }

    /**
     * Schedule a callback after a delay, automatically adjusted by timeScale.
     * Use this instead of clock.setTimeout for all game logic delays.
     */
    public setTimeout(callback: () => void, delay: number) {
        return this.clock.setTimeout(callback, delay / this.timeScale);
    }

    public tick(deltaTime: number) {
        const scaledDelta = deltaTime * this.timeScale;
        this.currentTime += scaledDelta;

        for (const object of this.objects.values()) {
            object.tick(scaledDelta, this.currentTime);
        }

        this.rules?.tick(scaledDelta);
    }
}

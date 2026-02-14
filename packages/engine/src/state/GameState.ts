import { Schema, type, MapSchema, view } from '@colyseus/schema';
import { ClockTimer } from '@colyseus/timer';
import { Random } from 'common-data/classes/Random';
import { IRandom } from 'common-data/types/IRandom';
import { IdProvider } from 'src/types/IdProvider';
import { GameStatus } from '../types/GameStatus';
import { CrewState } from './CrewState';
import { GameObject } from './GameObject';

export class GameState extends Schema {
    @type('string') gameStatus: GameStatus = 'setup';
    @view() @type({ map: GameObject }) objects = new MapSchema<GameObject>();
    @view() @type({ map: CrewState }) crews = new MapSchema<CrewState>();
    public readonly random: IRandom;

    constructor(private readonly idPool: IdProvider, public readonly clock: ClockTimer) {
        super();
        this.random = new Random(Math.random);
    }

    public getNewId(): string {
        return this.idPool.getId();
    }

    public add(object: GameObject) {
        this.objects.set(object.id, object);

        if (this.gameStatus === 'active') {
            // Add object to the viewscreen, helm and tactical clients' views on every crew.
            for (const crew of this.crews.values()) {
                crew.addObjectToViews(object);
            }
        }
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
    }

    public tick(deltaTime: number) {
        // TODO: update visibility of each object, for each crew.

        const currentTime = this.clock.currentTime;

        for (const object of this.objects.values()) {
            object.tick(deltaTime, currentTime);
        }
    }
}

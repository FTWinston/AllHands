import { Schema, type, MapSchema, view } from '@colyseus/schema';
import { IdProvider } from 'src/types/IdProvider';
import { GameStatus } from '../../types/GameStatus';
import { CrewState } from './CrewState';
import { GameObject } from './GameObject';

export class GameState extends Schema {
    @type('string') gameStatus: GameStatus = 'setup';
    @view() @type({ map: GameObject }) objects = new MapSchema<GameObject>();
    @view() @type({ map: CrewState }) crews = new MapSchema<CrewState>();

    constructor(private readonly idPool: IdProvider) {
        super();
    }

    public getNewId(): string {
        return this.idPool.getId();
    }

    public add(object: GameObject) {
        this.objects.set(object.id, object);
    }

    public remove(object: GameObject) {
        this.objects.delete(object.id);
        this.idPool.releaseId(object.id);
    }

    public tick(currentTime: number) {
        for (const object of this.objects.values()) {
            object.tick(currentTime);
        }
    }
}

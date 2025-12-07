import { Schema, type, MapSchema, view } from '@colyseus/schema';
import { IdProvider } from 'src/types/IdProvider';
import { IReadonlyStateMap } from 'src/types/IReadonlyStateMap';
import { GameStatus } from '../../types/GameStatus';
import { CrewState } from './CrewState';
import { GameObject } from './GameObject';

export class GameState extends Schema {
    @type('string') gameStatus: GameStatus = 'setup';
    @view() @type({ map: GameObject }) private _objects = new MapSchema<GameObject>();
    @view() @type({ map: CrewState }) crews = new MapSchema<CrewState>();

    constructor(private readonly idPool: IdProvider) {
        super();
    }

    public get objects(): IReadonlyStateMap<GameObject> {
        return this._objects;
    }

    public getNewId(): string {
        return this.idPool.getId();
    }

    public add(object: GameObject) {
        this._objects.set(object.id, object);
    }

    public remove(object: GameObject) {
        this._objects.delete(object.id);
        this.idPool.releaseId(object.id);
    }

    public tick(currentTime: number) {
        for (const object of this._objects.values()) {
            object.tick(currentTime);
        }
    }
}

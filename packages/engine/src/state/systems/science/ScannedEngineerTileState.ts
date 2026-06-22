import { Schema, type } from '@colyseus/schema';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { ScannedEngineerTileInfo } from 'common-data/features/space/types/GameObjectInfo';

export class ScannedEngineerTileState extends Schema implements ScannedEngineerTileInfo {
    constructor(system: ShipSystem) {
        super();
        this.system = system;
    }

    @type('string') system: ShipSystem;
    @type('number') power: number = 0;
    @type('number') health: number = 0;
}

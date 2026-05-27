import { Schema, type } from '@colyseus/schema';
import { ScannedEngineerTileInfo } from 'common-data/features/space/types/GameObjectInfo';

export class ScannedEngineerTileState extends Schema implements ScannedEngineerTileInfo {
    @type('string') system: string = '';
    @type('number') power: number = 0;
    @type('number') health: number = 0;
}

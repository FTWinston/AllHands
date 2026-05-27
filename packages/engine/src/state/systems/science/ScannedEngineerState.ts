import { ArraySchema, Schema, type } from '@colyseus/schema';
import { ScannedEngineerInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ScannedEngineerTileState } from './ScannedEngineerTileState';

export class ScannedEngineerState extends Schema implements ScannedEngineerInfo {
    @type('string') targetId: string = '';
    @type([ScannedEngineerTileState]) engineerTiles = new ArraySchema<ScannedEngineerTileState>();
}

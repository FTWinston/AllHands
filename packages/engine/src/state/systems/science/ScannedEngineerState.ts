import { ArraySchema, Schema, type } from '@colyseus/schema';
import { ScannedEngineerInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CardState } from 'src/state/CardState';
import { ScannedEngineerTileState } from './ScannedEngineerTileState';

export class ScannedEngineerState extends Schema implements ScannedEngineerInfo {
    @type('string') targetId: string = '';
    @type('uint8') power: number = 0;
    /** Copies of the cards in the system's hand, once science has read it. Null until then. */
    @type([CardState]) hand: ArraySchema<CardState> | null = null;
    @type([ScannedEngineerTileState]) engineerTiles = new ArraySchema<ScannedEngineerTileState>();
}

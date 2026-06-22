import { Schema, type } from '@colyseus/schema';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { ScannedScienceInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CardState } from 'src/state/CardState';

export class ScannedScienceState extends Schema implements ScannedScienceInfo {
    @type('string') targetId: string = '';
    @type(CardState) deflectorCard: CardState | null = null;
    @type(['string']) scanSystems: ShipSystem[] = [];
}

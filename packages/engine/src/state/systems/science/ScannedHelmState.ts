import { Schema, type } from '@colyseus/schema';
import { ScannedHelmInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CardState } from 'src/state/CardState';

export class ScannedHelmState extends Schema implements ScannedHelmInfo {
    @type('string') targetId: string = '';
    @type(CardState) activeManeuver: CardState | null = null;
}

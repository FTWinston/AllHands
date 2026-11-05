import { Schema, type } from '@colyseus/schema';
import { ScannedHelmInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CardState } from 'src/state/CardState';
import { CooldownState } from 'src/state/CooldownState';

export class ScannedHelmState extends Schema implements ScannedHelmInfo {
    @type('string') targetId: string = '';
    @type('uint8') power: number = 0;
    @type(CardState) activeManeuver: CardState | null = null;
    @type(CooldownState) maneuverProgress: CooldownState | null = null;
    @type('number') evasionChance: number = 0;
}

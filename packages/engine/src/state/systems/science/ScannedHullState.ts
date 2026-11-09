import { Schema, type } from '@colyseus/schema';
import { ShieldTuning } from 'common-data/features/ships/utils/shieldStats';
import { ScannedHullInfo } from 'common-data/features/space/types/GameObjectInfo';

export class ScannedHullState extends Schema implements ScannedHullInfo {
    @type('string') targetId: string = '';
    @type('uint8') health: number = 0;
    @type('uint8') maxHealth: number = 0;
    @type('uint16') shield: number = 0;
    @type('uint16') maxShield: number = 0;
    @type('string') shieldTuning: ShieldTuning | '' = '';
}

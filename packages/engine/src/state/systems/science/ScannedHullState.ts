import { Schema, type } from '@colyseus/schema';
import { ScannedHullInfo } from 'common-data/features/space/types/GameObjectInfo';

export class ScannedHullState extends Schema implements ScannedHullInfo {
    @type('string') targetId: string = '';
    @type('uint8') health: number = 0;
    @type('uint8') maxHealth: number = 0;
    @type('uint8') shield: number = 0;
}

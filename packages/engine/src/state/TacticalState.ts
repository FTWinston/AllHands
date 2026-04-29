import { ArraySchema, type } from '@colyseus/schema';
import { TacticalSystemInfo, TacticalSystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CrewSystemState } from './CrewSystemState';
import { GameState } from './GameState';
import { WeaponSlotState } from './WeaponSlotState';
import type { Ship } from './Ship';

export class TacticalState extends CrewSystemState implements TacticalSystemInfo {
    constructor(setup: TacticalSystemSetupInfo, gameState: GameState, ship: Ship, getCardId: () => number) {
        super(setup, gameState, ship, getCardId);

        for (let i = 0; i < setup.numSlots; i++) {
            this.slots.push(new WeaponSlotState());
        }
    }

    @type([WeaponSlotState]) slots = new ArraySchema<WeaponSlotState>();

    update(_currentTime: number) {
    }
}

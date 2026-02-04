import { ArraySchema, Schema, type } from '@colyseus/schema';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { EngineerIndividualSystemInfo, EngineerSystemInfo, SystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { GameState } from './GameState';
import { Ship } from './Ship';
import { SystemEffect } from './SystemEffect';
import { SystemState } from './SystemState';

export class EngineerIndividualSystem extends Schema implements EngineerIndividualSystemInfo {
    constructor(system: ShipSystem, power: number, health: number) {
        super();
        this.system = system;
        this.power = power;
        this.health = health;
    }

    @type('string') system: ShipSystem;
    @type('number') power: number;
    @type('number') health: number;
    @type([SystemEffect]) effects: ArraySchema<SystemEffect> = new ArraySchema<SystemEffect>();
}

export class EngineerState extends SystemState implements EngineerSystemInfo {
    constructor(setup: SystemSetupInfo, gameState: GameState, ship: Ship, getCardId: () => number) {
        super(setup, gameState, ship, getCardId);
    }

    @type([EngineerIndividualSystem]) systems = new ArraySchema<EngineerIndividualSystem>();
}

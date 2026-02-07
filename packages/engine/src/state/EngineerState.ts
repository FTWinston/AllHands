import { ArraySchema, Schema, type } from '@colyseus/schema';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { CrewSystemSetupInfo, EngineerIndividualSystemInfo, EngineerSystemInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CrewSystemState } from './CrewSystemState';
import { GameState } from './GameState';
import { Ship } from './Ship';
import { SystemEffect } from './SystemEffect';
import { SystemState } from './SystemState';

export class EngineerIndividualSystem extends Schema implements EngineerIndividualSystemInfo {
    constructor(readonly systemState: SystemState, system: ShipSystem) {
        super();
        this.system = system;
        this.power = systemState.powerLevel;
        this.health = systemState.health;
        systemState.linkEngineerSystem(this);
    }

    @type('string') system: ShipSystem;
    @type('number') readonly power: number;
    @type('number') readonly health: number;
    @type([SystemEffect]) effects: ArraySchema<SystemEffect> = new ArraySchema<SystemEffect>();

    setHealthFromSystem(systemState: SystemState) {
        (this as { health: number }).health = systemState.health;
    }

    setPowerLevelFromSystem(systemState: SystemState) {
        (this as { power: number }).power = systemState.powerLevel;
    }

    setSystemHealth(value: number) {
        this.systemState.setHealth(value);
    }

    setSystemPowerLevel(value: number) {
        this.systemState.setPowerLevel(value);
    }
}

export class EngineerState extends CrewSystemState implements EngineerSystemInfo {
    constructor(setup: CrewSystemSetupInfo, gameState: GameState, ship: Ship, getCardId: () => number) {
        super(setup, gameState, ship, getCardId);
    }

    public initSystems() {
        this.systems.push(new EngineerIndividualSystem(this.ship.hullState, 'hull'));
        this.systems.push(new EngineerIndividualSystem(this.ship.shieldState, 'shields'));
        this.systems.push(new EngineerIndividualSystem(this.ship.helmState, 'helm'));
        this.systems.push(new EngineerIndividualSystem(this.ship.sensorState, 'sensors'));
        this.systems.push(new EngineerIndividualSystem(this.ship.tacticalState, 'tactical'));
        this.systems.push(new EngineerIndividualSystem(this.ship.engineerState, 'engineer'));
    }

    @type([EngineerIndividualSystem]) systems = new ArraySchema<EngineerIndividualSystem>();
}

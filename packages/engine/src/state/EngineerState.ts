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
    @type('number') readonly power: number;
    @type('number') readonly health: number;
    @type([SystemEffect]) effects: ArraySchema<SystemEffect> = new ArraySchema<SystemEffect>();

    setHealthFromSystem(systemState: SystemState) {
        (this as { health: number }).health = systemState.health;
    }

    setPowerLevelFromSystem(systemState: SystemState) {
        (this as { power: number }).power = systemState.powerLevel;
    }
}

export class EngineerState extends SystemState implements EngineerSystemInfo {
    constructor(setup: SystemSetupInfo, gameState: GameState, ship: Ship, getCardId: () => number) {
        super(setup, gameState, ship, getCardId);
    }

    public initSystems() {
        this.systems.push(new EngineerIndividualSystem('hull', 3, 5));
        this.systems.push(new EngineerIndividualSystem('shields', 3, 5));

        const helmSystem = new EngineerIndividualSystem('helm', this.ship.helmState.powerLevel, this.ship.helmState.health);
        this.ship.helmState.linkEngineerSystem(helmSystem);
        this.systems.push(helmSystem);

        const sensorSystem = new EngineerIndividualSystem('sensors', this.ship.sensorState.powerLevel, this.ship.sensorState.health);
        this.ship.sensorState.linkEngineerSystem(sensorSystem);
        this.systems.push(sensorSystem);

        const tacticalSystem = new EngineerIndividualSystem('tactical', this.ship.tacticalState.powerLevel, this.ship.tacticalState.health);
        this.ship.tacticalState.linkEngineerSystem(tacticalSystem);
        this.systems.push(tacticalSystem);

        const engineerSystem = new EngineerIndividualSystem('engineer', this.ship.engineerState.powerLevel, this.ship.engineerState.health);
        this.ship.engineerState.linkEngineerSystem(engineerSystem);
        this.systems.push(engineerSystem);
    }

    @type([EngineerIndividualSystem]) systems = new ArraySchema<EngineerIndividualSystem>();
}

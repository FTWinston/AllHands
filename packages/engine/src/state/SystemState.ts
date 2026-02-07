import { Schema, type } from '@colyseus/schema';
import { SystemInfo, SystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { GameState } from './GameState';
import { Ship } from './Ship';
import type { EngineerIndividualSystem } from './EngineerState';

export class SystemState extends Schema implements SystemInfo {
    constructor(setup: SystemSetupInfo, protected readonly gameState: GameState, protected readonly ship: Ship) {
        super();

        this.powerLevel = setup.initialPowerLevel;
        this.maxPowerLevel = setup.maxPowerLevel;
        this.health = setup.health;
        this.maxHealth = setup.maxHealth;
    }

    /**
     * Link this system to an EngineerIndividualSystem so that power and health
     * changes are automatically propagated.
     */
    private linkedEngineerSystem?: EngineerIndividualSystem;

    linkEngineerSystem(engineerSystem: EngineerIndividualSystem) {
        this.linkedEngineerSystem = engineerSystem;
    }

    /**
     * Set the power level, propagating the change to the linked engineer system.
     */
    setPowerLevel(value: number) {
        (this as { powerLevel: number }).powerLevel = value;
        if (this.linkedEngineerSystem) {
            this.linkedEngineerSystem.setPowerLevelFromSystem(this);
        }
    }

    /**
     * Set the health, propagating the change to the linked engineer system.
     */
    setHealth(value: number) {
        (this as { health: number }).health = value;

        if (this.linkedEngineerSystem) {
            this.linkedEngineerSystem.setHealthFromSystem(this);
        }
    }

    @type('number') readonly powerLevel: number;
    maxPowerLevel: number;
    @type('number') readonly health: number;
    maxHealth: number;
}

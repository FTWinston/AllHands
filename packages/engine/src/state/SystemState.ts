import { Schema, type } from '@colyseus/schema';
import { SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { SystemInfo, SystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CooldownState } from './CooldownState';
import { GameState } from './GameState';
import { Ship } from './Ship';
import { SystemEffect } from './SystemEffect';
import type { EngineerSystemTile } from './EngineerState';

export class SystemState extends Schema implements SystemInfo {
    constructor(setup: SystemSetupInfo, protected readonly gameState: GameState, protected readonly ship: Ship) {
        super();

        this.powerLevel = setup.initialPowerLevel;
        this.maxPowerLevel = setup.maxPowerLevel;
        this.health = setup.health;
        this.maxHealth = setup.maxHealth;
    }

    /**
     * Link this system to an EngineerSystemTile so that power, health,
     * and effect changes are automatically propagated.
     */
    private linkedEngineerSystem?: EngineerSystemTile;

    linkEngineerSystem(engineerSystem: EngineerSystemTile) {
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

    /**
     * Get the effects currently applied to this system.
     */
    getEffects(): readonly SystemEffect[] {
        if (!this.linkedEngineerSystem) {
            return [];
        }
        return this.linkedEngineerSystem.effects.toArray();
    }

    /**
     * Add an effect to this system.
     */
    addEffect(effectType: SystemEffectType, duration?: CooldownState): SystemEffect {
        const effect = new SystemEffect(effectType, duration);
        if (this.linkedEngineerSystem) {
            this.linkedEngineerSystem.effects.push(effect);
        }
        return effect;
    }

    /**
     * Remove a specific effect from this system.
     * Returns true if the effect was found and removed.
     */
    removeEffect(effect: SystemEffect): boolean {
        if (!this.linkedEngineerSystem) {
            return false;
        }
        const index = this.linkedEngineerSystem.effects.indexOf(effect);
        if (index === -1) {
            return false;
        }
        this.linkedEngineerSystem.effects.splice(index, 1);
        return true;
    }

    @type('number') readonly powerLevel: number;
    maxPowerLevel: number;
    @type('number') readonly health: number;
    maxHealth: number;
}

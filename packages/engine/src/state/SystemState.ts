import { Schema, type } from '@colyseus/schema';
import { SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { SystemInfo, SystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { MinimalReadonlyArray } from 'common-data/types/MinimalArray';
import { GameState } from './GameState';
import { SystemEffect } from './SystemEffect';
import type { EngineerSystemTile } from './EngineerState';
import type { Ship } from './Ship';

export class SystemState extends Schema implements SystemInfo {
    constructor(setup: SystemSetupInfo, protected readonly _gameState: GameState, protected readonly _ship: Ship) {
        super();

        this.underlyingPowerLevel = this.powerLevel = setup.initialPowerLevel;
        this.maxPowerLevel = setup.maxPowerLevel;
        this.underlyingHealth = this.health = setup.health;
        this.maxHealth = setup.maxHealth;
    }

    /** Get the game state this system belongs to. */
    getGameState(): GameState {
        return this._gameState;
    }

    /** Get the ship this system belongs to. */
    getShip(): Ship {
        return this._ship;
    }

    /**
     * Link this system to an EngineerSystemTile so that power, health,
     * and effect changes are automatically propagated.
     */
    private linkedEngineerSystem?: EngineerSystemTile;

    linkEngineerSystem(engineerSystem: EngineerSystemTile) {
        this.linkedEngineerSystem = engineerSystem;
    }

    private underlyingPowerLevel: number;
    @type('number') readonly powerLevel: number;
    maxPowerLevel: number;

    private underlyingHealth: number;
    @type('number') readonly health: number;
    maxHealth: number;

    /**
     * Adjust the power level, keeping it within bounds and propagating the change to the linked engineer system.
     */
    adjustPowerLevel(value: number) {
        // Keep an "underlying" value so that effects that would adjust below 0 or above max can still be tracked and properly reversed when they effect expire.
        this.underlyingPowerLevel += value;

        // The "proper" value is always clamped to within the allowed bounds.
        (this as { powerLevel: number }).powerLevel = Math.max(0, Math.min(this.underlyingPowerLevel, this.maxPowerLevel));

        if (this.linkedEngineerSystem) {
            this.linkedEngineerSystem.setPowerLevelFromSystem(this);
        }
    }

    /**
     * Adjust the health value, keeping it within bounds and propagating the change to the linked engineer system.
     */
    adjustHealth(value: number) {
        // Keep an "underlying" value so that effects that would adjust below 0 or above max can still be tracked and properly reversed when they effect expire.
        this.underlyingHealth += value;

        // The "proper" value is always clamped to within the allowed bounds.
        (this as { health: number }).health = Math.max(0, Math.min(this.underlyingHealth, this.maxHealth));

        if (this.linkedEngineerSystem) {
            this.linkedEngineerSystem.setHealthFromSystem(this);
        }
    }

    /**
     * Get the effects currently applied to this system.
     */
    getEffects(): MinimalReadonlyArray<SystemEffect> {
        return this.linkedEngineerSystem?.effects ?? [];
    }

    /**
     * Add an effect to this system.
     */
    addEffect(effectType: SystemEffectType, duration?: number) {
        if (!this.linkedEngineerSystem) {
            throw new Error('Cannot add effect to system that is not linked to an engineer system tile');
        }

        this.linkedEngineerSystem.addEffect(effectType, duration);
    }

    /**
     * Remove a specific effect from this system.
     * Returns true if the effect was found and removed.
     */
    removeEffect(effect: SystemEffectType, early: boolean): boolean {
        if (!this.linkedEngineerSystem) {
            throw new Error('Cannot remove effect from system that is not linked to an engineer system tile');
        }

        return this.linkedEngineerSystem.removeEffect(effect, early);
    }

    /**
     * Generate (e.g. a card) for this system.
     * Base SystemState does nothing; subclasses can override.
     */
    generate(): void {
        // Do nothing by default.
    }
}

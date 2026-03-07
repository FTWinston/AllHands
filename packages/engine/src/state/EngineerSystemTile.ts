import { ArraySchema, Schema, type } from '@colyseus/schema';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { EngineerSystemTileInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getSystemEffectDefinition } from '../effects/getEngineSystemEffectDefinition';
import { CooldownState } from './CooldownState';
import { SystemEffect } from './SystemEffect';
import { SystemState } from './SystemState';

export class EngineerSystemTile extends Schema implements EngineerSystemTileInfo {
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
    @type([SystemEffect]) effects = new ArraySchema<SystemEffect>();

    @type('boolean') generating = false;

    setHealthFromSystem(systemState: SystemState) {
        (this as { health: number }).health = systemState.health;
    }

    setPowerLevelFromSystem(systemState: SystemState) {
        (this as { power: number }).power = systemState.powerLevel;
    }

    adjustSystemHealth(value: number) {
        this.systemState.adjustHealth(value);
    }

    adjustSystemPowerLevel(value: number) {
        this.systemState.adjustPowerLevel(value);
    }

    /**
     * Add an effect to this system, or update its duration if already present.
     * We don't currently have the concept of an effect that can stack multiple times.
     */
    addEffect(effectType: SystemEffectType, duration?: number, level?: number): boolean {
        const startTime = this.systemState.getGameState().clock.currentTime;
        const cooldown = duration ? new CooldownState(startTime, startTime + duration) : null;

        let effect = this.effects.find(e => e.type === effectType);
        if (effect) {
            effect.progress = cooldown;
        } else {
            effect = new SystemEffect(effectType, cooldown, level);

            if (!getSystemEffectDefinition(effectType).apply(this, level)) {
                return false;
            }

            this.effects.push(effect);
        }

        return true;
    }

    /**
     * Remove a specific effect from this system.
     * Returns true if the effect was found and removed.
     */
    removeEffect(effectType: SystemEffectType, early: boolean): boolean {
        const index = this.effects.findIndex(e => e.type === effectType);
        if (index === -1) {
            return false;
        }
        const level = this.effects[index].level || undefined;
        this.effects.splice(index, 1);

        getSystemEffectDefinition(effectType)
            .remove(this, early, level);

        return true;
    }

    /**
     * Get the current level of an effect on this system, or 0 if the effect is not present.
     */
    getEffectLevel(effectType: SystemEffectType): number {
        const effect = this.effects.find(e => e.type === effectType);
        return effect ? effect.level : 0;
    }

    /**
     * Increment the level of an effect on this system by one, up to an optional maximum level.
     * Adds the effect at level 1 if it is not already present.
     * Returns true if no more levels can be added after the increment.
     */
    incrementEffectLevel(effectType: SystemEffectType, maxLevel?: number, duration?: number): boolean {
        const effect = this.effects.find(e => e.type === effectType);
        if (effect) {
            const oldLevel = effect.level;
            if (maxLevel !== undefined && oldLevel >= maxLevel) {
                return true;
            }
            const newLevel = oldLevel + 1;
            effect.level = newLevel;
            getSystemEffectDefinition(effectType).onLevelChanged?.(this, newLevel, oldLevel);
            return maxLevel !== undefined && newLevel >= maxLevel;
        } else {
            this.addEffect(effectType, duration, 1);
            return maxLevel !== undefined && maxLevel <= 1;
        }
    }

    /**
     * Decrement the level of an effect on this system by one.
     * Removes the effect if the level reaches 0.
     * Returns true if the effect was removed (level reached 0 or was not present).
     */
    decrementEffectLevel(effectType: SystemEffectType): boolean {
        const effect = this.effects.find(e => e.type === effectType);
        if (!effect) {
            return true;
        }
        const oldLevel = effect.level;
        if (oldLevel <= 1) {
            this.removeEffect(effectType, true);
            return true;
        }
        const newLevel = oldLevel - 1;
        effect.level = newLevel;
        getSystemEffectDefinition(effectType).onLevelChanged?.(this, newLevel, oldLevel);
        return false;
    }
}

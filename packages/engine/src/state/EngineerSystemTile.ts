import { ArraySchema, Schema, type } from '@colyseus/schema';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { LeveledSystemEffectType, SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
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
    addEffect(effectType: SystemEffectType, duration?: number, level: number = 1): boolean {
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
        const level = this.effects[index].level;
        this.effects.splice(index, 1);

        getSystemEffectDefinition(effectType)
            .remove(this, early, level);

        return true;
    }

    /**
     * Check if this system has a specific effect.
     */
    hasEffect(effectType: SystemEffectType): boolean {
        return this.effects.some(e => e.type === effectType);
    }

    /**
     * Get the current level of an effect on this system, or 0 if the effect is not present.
     */
    getEffectLevel(effectType: LeveledSystemEffectType): number {
        const effect = this.effects.find(e => e.type === effectType);
        return effect ? effect.level : 0;
    }

    /**
     * Change the level of a leveled effect on this system by a specified adjustment, up to the effect's declared max level.
     * Adds the effect at the adjustment's level if positive, and it is not already present.
     * Returns true if no more levels can be added after the increment.
     */
    adjustEffectLevel(effectType: LeveledSystemEffectType, adjustment: number, newDuration?: number) {
        const def = getSystemEffectDefinition(effectType);
        const maxLevel = def.maxLevel ?? 255;

        const effect = this.effects.find(e => e.type === effectType);
        if (effect) {
            const oldLevel = effect.level;
            if (adjustment > 0 && oldLevel >= maxLevel) {
                return true;
            }
            const newLevel = Math.min(oldLevel + adjustment, maxLevel);
            if (newLevel > 0) {
                effect.level = newLevel;
                def.onLevelChanged?.(this, newLevel, oldLevel);
                return newLevel >= maxLevel;
            } else {
                this.removeEffect(effectType, true);
                return false;
            }
        } else if (adjustment > 0) {
            this.addEffect(effectType, newDuration, 1);
            return maxLevel <= 1;
        } else {
            return false;
        }
    }
}

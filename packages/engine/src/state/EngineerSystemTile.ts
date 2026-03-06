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
    addEffect(effectType: SystemEffectType, duration?: number): boolean {
        const startTime = this.systemState.getGameState().clock.currentTime;
        const cooldown = duration ? new CooldownState(startTime, startTime + duration) : null;

        let effect = this.effects.find(e => e.type === effectType);
        if (effect) {
            effect.progress = cooldown;
        } else {
            effect = new SystemEffect(effectType, cooldown);

            if (!getSystemEffectDefinition(effectType).apply(this)) {
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
    removeEffect(effect: SystemEffectType, early: boolean): boolean {
        const index = this.effects.findIndex(e => e.type === effect);
        if (index === -1) {
            return false;
        }
        this.effects.splice(index, 1);

        getSystemEffectDefinition(effect)
            .remove(this, early);

        return true;
    }

    countReducedPowerEffects(): number {
        return this.effects.reduce((total, effect) => {
            switch (effect.type) {
                case 'reducedPower1':
                    return total + 1;
                case 'reducedPower2':
                    return total + 2;
                case 'reducedPower3':
                    return total + 3;
                case 'reducedPower4':
                    return total + 4;
                default:
                    return total;
            }
        }, 0);
    }

    /**
     * Increment the reduced power effect on this system by one "level", up to the maximum level of reducedPower4.
     * Returns true if no more reduced power effects can be added after the increment.
     */
    incrementReducedPowerEffect() {
        if (this.removeEffect('reducedPower3', true)) {
            this.addEffect('reducedPower4');
            return true;
        } else if (this.removeEffect('reducedPower2', true)) {
            this.addEffect('reducedPower3');
        } else if (this.removeEffect('reducedPower1', true)) {
            this.addEffect('reducedPower2');
        } else {
            this.addEffect('reducedPower1');
        }

        return false;
    }

    /**
     * Decrement the reduced power effect on this system by one "level", if present.
     * Returns true if no reduced power effects are still present after the decrement.
     */
    decrementReducedPowerEffect() {
        if (this.removeEffect('reducedPower4', true)) {
            this.addEffect('reducedPower3');
            return false;
        } else if (this.removeEffect('reducedPower3', true)) {
            this.addEffect('reducedPower2');
            return false;
        } else if (this.removeEffect('reducedPower2', true)) {
            this.addEffect('reducedPower1');
            return false;
        } else {
            this.removeEffect('reducedPower1', true);
        }

        return true;
    }
}

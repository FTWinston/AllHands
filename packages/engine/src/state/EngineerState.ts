import { ArraySchema, Schema, type } from '@colyseus/schema';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { CrewSystemSetupInfo, EngineerSystemTileInfo, EngineerSystemInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getSystemEffectDefinition } from '../effects/getEngineSystemEffectDefinition';
import { CooldownState } from './CooldownState';
import { CrewSystemState } from './CrewSystemState';
import { GameState } from './GameState';
import { SystemEffect } from './SystemEffect';
import { SystemState } from './SystemState';
import type { Ship } from './Ship';

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
    @type([SystemEffect]) effects: ArraySchema<SystemEffect> = new ArraySchema<SystemEffect>();

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
        const cooldown = duration ? new CooldownState(startTime, startTime + duration) : undefined;

        let effect = this.effects.find(e => e.type === effectType);
        if (effect) {
            effect.duration = cooldown;
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
}

export class EngineerState extends CrewSystemState implements EngineerSystemInfo {
    constructor(setup: CrewSystemSetupInfo, gameState: GameState, ship: Ship, getCardId: () => number) {
        super(setup, gameState, ship, getCardId);
    }

    public initSystems() {
        const ship = this.getShip();
        this.systems.push(new EngineerSystemTile(ship.hullState, 'hull'));
        this.systems.push(new EngineerSystemTile(ship.shieldState, 'shields'));
        this.systems.push(new EngineerSystemTile(ship.helmState, 'helm'));
        this.systems.push(new EngineerSystemTile(ship.sensorState, 'sensors'));
        this.systems.push(new EngineerSystemTile(ship.tacticalState, 'tactical'));
        this.systems.push(new EngineerSystemTile(ship.engineerState, 'engineer'));
    }

    @type([EngineerSystemTile]) systems = new ArraySchema<EngineerSystemTile>();

    /**
     * The order in which systems are visited for card generation.
     * Each value is an index into the systems array.
     */
    private static readonly generationSequence = [0, 2, 4, 5, 3, 1];

    private perSystemDuration = 2000;

    /** Current position within the generationSequence. */
    private generationSequenceIndex = 0;

    /** The time at which the current system's generation started, or undefined if not yet started. */
    private generationStartTime: number | undefined;

    update(currentTime: number) {
        this.removeExpiredEffects(currentTime);

        this.updateCardGeneration(currentTime);
    }

    /**
     * Remove any effects from system tiles whose duration has reached its end time.
     */
    private removeExpiredEffects(currentTime: number) {
        for (const tile of this.systems) {
            for (let i = tile.effects.length - 1; i >= 0; i--) {
                const effect = tile.effects[i];
                if (effect.duration && currentTime >= effect.duration.endTime) {
                    tile.removeEffect(effect.type, false);
                }
            }
        }
    }

    /**
     * Round-robin card generation across all systems, one at a time.
     */
    private updateCardGeneration(currentTime: number) {
        const sequence = EngineerState.generationSequence;
        const systemTile = this.systems[sequence[this.generationSequenceIndex]];
        if (!systemTile) {
            return;
        }

        if (this.generationStartTime === undefined) {
            // Start generation on this system.
            systemTile.generating = true;
            this.generationStartTime = currentTime;

            // Update cardGeneration on each crew system to show the full cycle duration.
            this.updateCrewSystemCardGeneration(currentTime);
        } else if (currentTime >= this.generationStartTime + this.perSystemDuration) {
            // Generation complete: unmark and generate.
            systemTile.generating = false;
            systemTile.systemState.generate();

            // Advance to the next system.
            this.generationSequenceIndex = (this.generationSequenceIndex + 1) % sequence.length;
            this.generationStartTime = undefined;

            // Immediately start the next system in the same update call.
            this.updateCardGeneration(currentTime);
        }
    }

    /**
     * Update the cardGeneration cooldown on each crew system to reflect
     * how long until that system next receives a generated card.
     */
    private updateCrewSystemCardGeneration(currentTime: number) {
        const sequence = EngineerState.generationSequence;
        const perSystemDuration = this.perSystemDuration;
        const totalDuration = sequence.length * perSystemDuration;

        for (let offset = 0; offset < sequence.length; offset++) {
            const seqIndex = (this.generationSequenceIndex + offset) % sequence.length;
            const tile = this.systems[sequence[seqIndex]];
            if (!tile) {
                continue;
            }

            const crewSystem = tile.systemState;
            if (crewSystem instanceof CrewSystemState) {
                crewSystem.cardGeneration.clear();

                // This system will receive its card after (offset + 1) individual
                // generation durations, and its full cycle is totalDuration long.
                const cardArrival = currentTime + (offset + 1) * perSystemDuration;
                const cycleStart = cardArrival - totalDuration;
                crewSystem.cardGeneration.push(new CooldownState(cycleStart, cardArrival));
            }
        }
    }

    /**
     * Called after two systems have been swapped in the systems array.
     * Updates the generating flag and cardGeneration cooldowns on affected tiles
     * so that the current generation sequence position is respected,
     * and the progress percentage of each crew system's cooldown is preserved.
     */
    onSystemsSwapped(indexA: number, indexB: number) {
        const sequence = EngineerState.generationSequence;
        const currentTime = this.getGameState().clock.currentTime;

        // The generating index in the systems array.
        const generatingSystemsIndex = sequence[this.generationSequenceIndex];

        // Update generating flags: generation follows the array index, not the tile.
        const tileA = this.systems[indexA];
        const tileB = this.systems[indexB];

        if (indexA === generatingSystemsIndex || indexB === generatingSystemsIndex) {
            // One of the swapped tiles is now at the generating index.
            // Ensure only the tile at the generating index has generating = true.
            tileA.generating = indexA === generatingSystemsIndex;
            tileB.generating = indexB === generatingSystemsIndex;
        }

        // Update cardGeneration cooldowns on affected crew systems,
        // preserving the current progress percentage.
        this.preserveGenerationProgress(tileA, currentTime);
        this.preserveGenerationProgress(tileB, currentTime);
    }

    /**
     * Recalculate a crew system's cardGeneration cooldown after its tile
     * has moved to a new position in the systems array, preserving
     * the current progress percentage.
     */
    private preserveGenerationProgress(tile: EngineerSystemTile, currentTime: number) {
        const crewSystem = tile.systemState;
        if (!(crewSystem instanceof CrewSystemState) || crewSystem.cardGeneration.length === 0) {
            return;
        }

        const oldProgress = crewSystem.cardGeneration[0];
        const oldFraction = (currentTime - oldProgress.startTime) / (oldProgress.endTime - oldProgress.startTime);

        // Find how many steps until this tile next generates.
        const sequence = EngineerState.generationSequence;
        const systemsIndex = this.systems.indexOf(tile);
        let stepsUntilGeneration = 0;
        for (let offset = 0; offset < sequence.length; offset++) {
            const seqIndex = (this.generationSequenceIndex + offset) % sequence.length;
            if (sequence[seqIndex] === systemsIndex) {
                stepsUntilGeneration = offset + 1;
                break;
            }
        }

        // Calculate the new end time based on when generation started
        // for the current step, plus the number of steps until this system.
        const generationStartTime = this.generationStartTime ?? currentTime;
        const newEnd = generationStartTime + stepsUntilGeneration * this.perSystemDuration;

        // Derive the new start time to preserve the progress percentage.
        const newStart = oldFraction < 1
            ? (currentTime - oldFraction * newEnd) / (1 - oldFraction)
            : newEnd - (oldProgress.endTime - oldProgress.startTime); // fallback: keep same duration

        crewSystem.cardGeneration.clear();
        crewSystem.cardGeneration.push(new CooldownState(newStart, newEnd));
    }
}

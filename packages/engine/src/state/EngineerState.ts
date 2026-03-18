import { ArraySchema, type } from '@colyseus/schema';
import { MAX_POWER_LEVEL } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { CrewSystemSetupInfo, EngineerSystemInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getSystemEffectDefinition } from '../effects/getEngineSystemEffectDefinition';
import { CooldownState } from './CooldownState';
import { CrewSystemState } from './CrewSystemState';
import { EngineerSystemTile } from './EngineerSystemTile';
import { GameState } from './GameState';
import type { Ship } from './Ship';

export class EngineerState extends CrewSystemState implements EngineerSystemInfo {
    constructor(setup: CrewSystemSetupInfo, gameState: GameState, ship: Ship, getCardId: () => number) {
        super(setup, gameState, ship, getCardId);
    }

    public initSystems() {
        const ship = this.getShip();
        this.systems.push(new EngineerSystemTile(ship.hullState, 'hull'));
        this.systems.push(new EngineerSystemTile(ship.reactorState, 'reactor'));
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

    /**
     * Maps the reactor's power level to the per-system generation duration (ms).
     */
    private static readonly generationDurationByReactorPower = [10_000, 5_000, 3_500, 2_500, 1_750, 1_000];

    private get perSystemGenerationDuration(): number {
        let reactorPower = this.getShip().reactorState.powerLevel;
        // Clamp to valid range just in case.
        reactorPower = Math.max(0, Math.min(reactorPower, EngineerState.generationDurationByReactorPower.length - 1));
        return EngineerState.generationDurationByReactorPower[reactorPower];
    }

    /** Current position within the generationSequence. */
    private generationSequenceIndex = 0;

    /** Cooldown tracking progress of the currently generating system, or undefined if not yet started. */
    private generationProgress: CooldownState | undefined;

    update(currentTime: number) {
        this.removeExpiredEffects(currentTime);
        this.processEffectTicks(currentTime);
        this.updateCardGeneration(currentTime);
    }

    /**
     * Remove any effects from system tiles whose duration has reached its end time.
     */
    private removeExpiredEffects(currentTime: number) {
        for (const tile of this.systems) {
            for (let i = tile.effects.length - 1; i >= 0; i--) {
                const effect = tile.effects[i];
                if (effect.progress && currentTime >= effect.progress.endTime) {
                    tile.removeEffect(effect.type, false);
                }
            }
        }
    }

    /**
     * Run tick functions for effects that have a tick interval.
     */
    private processEffectTicks(currentTime: number) {
        for (const tile of this.systems) {
            for (const effect of tile.effects) {
                const def = getSystemEffectDefinition(effect.type);
                if (def.tickInterval && def.tick && currentTime >= effect.lastTickTime + def.tickInterval) {
                    effect.lastTickTime = currentTime;
                    def.tick(tile, effect.level);
                }
            }
        }
    }

    /**
     * If reactor health changes, add/remove reduced power effects to other systems,
     * of a total number equal to how much health has been lost.
     */
    public onReactorHealthChanged(reactorHealth: number, reactorMaxHealth: number) {
        const targetNumReducedPowerEffects = reactorMaxHealth - reactorHealth;

        let existingNumReducedPowerEffects = this.systems.reduce((total, tile) => {
            return total + tile.getEffectLevel('reducedPower');
        }, 0);

        const random = this.getGameState().random;

        if (targetNumReducedPowerEffects > existingNumReducedPowerEffects) {
            const systems = this.systems.filter(tile => tile.system !== 'reactor' && tile.getEffectLevel('reducedPower') < MAX_POWER_LEVEL);

            // Add new reduced power effects to systems, randomly, until the total number matches the target.
            do {
                const system = random.pick(systems);
                const maxed = system.adjustEffectLevel('reducedPower', 1);
                existingNumReducedPowerEffects++;

                if (maxed) {
                    // This system can't take any more reduced power effects, so remove it from the pool of systems we can add effects to.
                    const index = systems.indexOf(system);
                    systems.splice(index, 1);
                }
            } while (targetNumReducedPowerEffects > existingNumReducedPowerEffects && systems.length > 0);
        } else if (targetNumReducedPowerEffects < existingNumReducedPowerEffects) {
            const systems = this.systems.filter(tile => tile.getEffectLevel('reducedPower') > 0);

            // Remove reduced power effects from systems, randomly, until the total number matches the target.
            do {
                const system = random.pick(systems);
                const emptied = system.adjustEffectLevel('reducedPower', -1);
                existingNumReducedPowerEffects--;

                if (emptied) {
                    // This system has no more reduced power effects, so remove it from the pool of systems we can remove effects from.
                    const index = systems.indexOf(system);
                    systems.splice(index, 1);
                }
            } while (targetNumReducedPowerEffects < existingNumReducedPowerEffects && systems.length > 0);
        }
    }

    /**
     * Rescale generation progress and crew system cooldowns when the reactor
     * power level changes, preserving the current progress fraction of each.
     */
    public onReactorPowerChanged(currentTime: number) {
        if (!this.generationProgress) {
            return;
        }

        const newPerSystemDuration = this.perSystemGenerationDuration;

        // Rescale the current system's generation progress.
        this.generationProgress.rescaleToDuration(currentTime, newPerSystemDuration);

        // Rescale all crew system cardGeneration cooldowns.
        const priorityTile = this.systems.find(t => t.hasEffect('generationPriority'));
        const activeSlots = EngineerState.generationSequence.length - (priorityTile ? 1 : 0);
        const newTotalDuration = activeSlots * newPerSystemDuration;

        for (const tile of this.systems) {
            const crewSystem = tile.systemState;
            if (crewSystem instanceof CrewSystemState && crewSystem.cardGeneration) {
                const duration = tile === priorityTile ? newPerSystemDuration : newTotalDuration;
                crewSystem.cardGeneration.rescaleToDuration(currentTime, duration);
            }
        }
    }

    /**
     * Round-robin card generation across all systems, one at a time.
     * If a system has the generationPriority effect, its slot in the sequence is
     * skipped, but it receives a bonus generate call after every other system generates.
     */
    private updateCardGeneration(currentTime: number) {
        const sequence = EngineerState.generationSequence;
        const systemTile = this.systems[sequence[this.generationSequenceIndex]];
        if (!systemTile) {
            return;
        }

        if (!this.generationProgress) {
            // Skip this system's slot if it has the generationPriority effect.
            if (systemTile.hasEffect('generationPriority')) {
                this.generationSequenceIndex = (this.generationSequenceIndex + 1) % sequence.length;
                this.updateCardGeneration(currentTime);
                return;
            }

            // Start generation on this system.
            systemTile.generating = true;
            this.generationProgress = new CooldownState(currentTime, currentTime + this.perSystemGenerationDuration);

            // Update cardGeneration on each crew system to show the full cycle duration.
            this.updateCrewSystemCardGeneration(currentTime);
        } else if (currentTime >= this.generationProgress.endTime) {
            // Generation complete: unmark and generate.
            systemTile.generating = false;
            systemTile.systemState.generate.trigger();

            // If a system has generationPriority, also trigger generation on it.
            const priorityTile = this.systems.find(t => t.hasEffect('generationPriority'));
            if (priorityTile && priorityTile !== systemTile) {
                priorityTile.systemState.generate.trigger();
            }

            // Advance to the next system.
            this.generationSequenceIndex = (this.generationSequenceIndex + 1) % sequence.length;
            this.generationProgress = undefined;

            // Immediately start the next system in the same update call.
            this.updateCardGeneration(currentTime);
        }
    }

    /**
     * Update the cardGeneration cooldown on each crew system to reflect
     * how long until that system next receives a generated card.
     * When a system has generationPriority, its slot is skipped in the
     * sequence but it generates after every other system, so its cooldown
     * cycle equals one slot duration.
     */
    private updateCrewSystemCardGeneration(currentTime: number) {
        const sequence = EngineerState.generationSequence;
        const perSystemDuration = this.perSystemGenerationDuration;
        const priorityTile = this.systems.find(t => t.hasEffect('generationPriority'));
        const activeSlots = sequence.length - (priorityTile ? 1 : 0);
        const totalDuration = activeSlots * perSystemDuration;

        // Priority system generates after every slot, so its cycle is one slot long.
        if (priorityTile) {
            const crewSystem = priorityTile.systemState;
            if (crewSystem instanceof CrewSystemState) {
                crewSystem.cardGeneration = null;
                crewSystem.cardGeneration = new CooldownState(currentTime, currentTime + perSystemDuration);
            }
        }

        // Set cardGeneration for each non-priority system based on its
        // position in the effective sequence.
        let slotOffset = 0;
        for (let offset = 0; offset < sequence.length; offset++) {
            const seqIndex = (this.generationSequenceIndex + offset) % sequence.length;
            const tile = this.systems[sequence[seqIndex]];
            if (!tile || tile === priorityTile) {
                continue;
            }

            const crewSystem = tile.systemState;
            if (crewSystem instanceof CrewSystemState) {
                crewSystem.cardGeneration = null;
                const cardArrival = currentTime + (slotOffset + 1) * perSystemDuration;
                const cycleStart = cardArrival - totalDuration;
                crewSystem.cardGeneration = new CooldownState(cycleStart, cardArrival);
            }
            slotOffset++;
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
     * the current progress fraction.
     */
    private preserveGenerationProgress(tile: EngineerSystemTile, currentTime: number) {
        const crewSystem = tile.systemState;
        if (!(crewSystem instanceof CrewSystemState) || !crewSystem.cardGeneration) {
            return;
        }

        const sequence = EngineerState.generationSequence;
        const priorityTile = this.systems.find(t => t.hasEffect('generationPriority'));
        const generationEndTime = this.generationProgress?.endTime ?? currentTime;

        if (tile === priorityTile) {
            // Priority system generates after every slot, so its next card
            // arrives when the current system finishes generating.
            crewSystem.cardGeneration.rescaleToEnd(currentTime, generationEndTime);
            return;
        }

        // Find how many effective steps until this tile next generates,
        // skipping the priority system's slot.
        const systemsIndex = this.systems.indexOf(tile);
        let stepsUntilGeneration = 0;
        for (let offset = 0; offset < sequence.length; offset++) {
            const seqIndex = (this.generationSequenceIndex + offset) % sequence.length;
            const seqSystemsIndex = sequence[seqIndex];

            // Skip the priority system's slot.
            if (this.systems[seqSystemsIndex] === priorityTile) {
                continue;
            }

            stepsUntilGeneration++;
            if (seqSystemsIndex === systemsIndex) {
                break;
            }
        }

        // The new end time: when the current system finishes generating,
        // plus the remaining steps until this system gets its turn.
        const newEnd = generationEndTime + (stepsUntilGeneration - 1) * this.perSystemGenerationDuration;

        crewSystem.cardGeneration.rescaleToEnd(currentTime, newEnd);
    }

    /**
     * Get the systems adjacent to the system at the given index.
     * The grid is 3 rows × 2 columns (indices 0-5):
     *   0 | 1
     *   2 | 3
     *   4 | 5
     * Adjacent means sharing an edge (horizontal or vertical, not diagonal).
     */
    public getAdjacentSystems(systemIndex: number): EngineerSystemTile[] {
        const indices: number[] = [];
        // Horizontal neighbor (same row, other column)
        indices.push(systemIndex % 2 === 0 ? systemIndex + 1 : systemIndex - 1);
        // Above
        if (systemIndex >= 2) indices.push(systemIndex - 2);
        // Below
        if (systemIndex < 4) indices.push(systemIndex + 2);
        return indices.map(i => this.systems[i]);
    }
}

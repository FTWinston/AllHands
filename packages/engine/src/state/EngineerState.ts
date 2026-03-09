import { ArraySchema, type } from '@colyseus/schema';
import { MAX_POWER_LEVEL } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { CrewSystemSetupInfo, EngineerSystemInfo } from 'common-data/features/space/types/GameObjectInfo';
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
        const newTotalDuration = EngineerState.generationSequence.length * newPerSystemDuration;
        for (const tile of this.systems) {
            const crewSystem = tile.systemState;
            if (crewSystem instanceof CrewSystemState && crewSystem.cardGeneration) {
                crewSystem.cardGeneration.rescaleToDuration(currentTime, newTotalDuration);
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

        if (!this.generationProgress) {
            // Start generation on this system.
            systemTile.generating = true;
            this.generationProgress = new CooldownState(currentTime, currentTime + this.perSystemGenerationDuration);

            // Update cardGeneration on each crew system to show the full cycle duration.
            this.updateCrewSystemCardGeneration(currentTime);
        } else if (currentTime >= this.generationProgress.endTime) {
            // Generation complete: unmark and generate.
            systemTile.generating = false;
            systemTile.systemState.generate.trigger();

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
     */
    private updateCrewSystemCardGeneration(currentTime: number) {
        const sequence = EngineerState.generationSequence;
        const perSystemDuration = this.perSystemGenerationDuration;
        const totalDuration = sequence.length * perSystemDuration;

        for (let offset = 0; offset < sequence.length; offset++) {
            const seqIndex = (this.generationSequenceIndex + offset) % sequence.length;
            const tile = this.systems[sequence[seqIndex]];
            if (!tile) {
                continue;
            }

            const crewSystem = tile.systemState;
            if (crewSystem instanceof CrewSystemState) {
                crewSystem.cardGeneration = null;

                // This system will receive its card after (offset + 1) individual
                // generation durations, and its full cycle is totalDuration long.
                const cardArrival = currentTime + (offset + 1) * perSystemDuration;
                const cycleStart = cardArrival - totalDuration;
                crewSystem.cardGeneration = new CooldownState(cycleStart, cardArrival);
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
     * the current progress fraction.
     */
    private preserveGenerationProgress(tile: EngineerSystemTile, currentTime: number) {
        const crewSystem = tile.systemState;
        if (!(crewSystem instanceof CrewSystemState) || !crewSystem.cardGeneration) {
            return;
        }

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

        // The new end time: when the current system finishes generating,
        // plus the remaining steps until this system gets its turn.
        const generationEndTime = this.generationProgress?.endTime ?? currentTime;
        const newEnd = generationEndTime + (stepsUntilGeneration - 1) * this.perSystemGenerationDuration;

        crewSystem.cardGeneration.rescaleToEnd(currentTime, newEnd);
    }
}

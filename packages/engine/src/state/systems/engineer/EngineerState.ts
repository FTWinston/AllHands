import { ArraySchema, type } from '@colyseus/schema';
import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { MAX_POWER_LEVEL } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { CrewSystemSetupInfo, EngineerSystemInfo } from 'common-data/features/space/types/GameObjectInfo';
import { EngineCardDefinition, EngineSystemTargetCardDefinition } from 'src/cards/EngineCardDefinition';
import { getCardDefinition } from 'src/cards/getEngineCardDefinition';
import { getSystemEffectDefinition } from 'src/effects/getEngineSystemEffectDefinition';
import { CooldownState } from 'src/state/CooldownState';
import { GameState } from 'src/state/GameState';
import { CrewSystemState } from '../CrewSystemState';
import { EngineerSystemTile } from './EngineerSystemTile';
import type { Ship } from 'src/state/Ship';

export class EngineerState extends CrewSystemState implements EngineerSystemInfo {
    constructor(setup: CrewSystemSetupInfo, gameState: GameState, ship: Ship, scannedSystemIndex: number, getCardId: () => number) {
        super(setup, gameState, ship, scannedSystemIndex, getCardId);
    }

    public initSystems() {
        const ship = this.getShip();
        this.systems.push(new EngineerSystemTile(ship.hullState, 'hull'));
        this.systems.push(new EngineerSystemTile(ship.reactorState, 'reactor'));
        this.systems.push(new EngineerSystemTile(ship.helmState, 'helm'));
        this.systems.push(new EngineerSystemTile(ship.scienceState, 'science'));
        this.systems.push(new EngineerSystemTile(ship.tacticalState, 'tactical'));
        this.systems.push(new EngineerSystemTile(ship.engineerState, 'engineer'));
    }

    @type([EngineerSystemTile]) systems = new ArraySchema<EngineerSystemTile>();

    @type('uint8') maxRepairCapacity = 50;

    /**
     * How much to repair when repairing a system. Consumed when repairing, and recharged by playing cards onto the "repair" (fake) system target.
     */
    @type('uint8') repairCapacity: number = this.maxRepairCapacity;

    /**
     * The order in which systems are visited for card generation.
     * Each value is an index into the systems array.
     */
    private static readonly generationSequence = [0, 2, 4, 5, 3, 1];

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
     * Rescale generation progress and crew system cooldowns, preserving the current
     * progress fraction of each. Call this whenever any system's generationDuration
     * may have changed.
     */
    public onGenerationDurationChanged() {
        if (!this.generationProgress) {
            return;
        }

        const systemTile = this.getSequenceTile();
        if (!systemTile) {
            return;
        }

        // Rescale the current system's generation progress.
        const currentTime = this.getGameState().currentTime;
        this.generationProgress.rescaleToDuration(currentTime, this.getGenerationDuration(systemTile));

        // Rescale all crew system cardGeneration cooldowns.
        const priorityTile = this.systems.find(t => t.hasEffect('generationPriority'));
        const totalDuration = this.getActiveCycleDuration(priorityTile);

        for (const tile of this.systems) {
            const crewSystem = tile.systemState;
            if (crewSystem instanceof CrewSystemState && crewSystem.cardGeneration) {
                const duration = tile === priorityTile ? this.getGenerationDuration(tile) : totalDuration;
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
        const systemTile = this.getSequenceTile();
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

            const systemGenerationDuration = this.getGenerationDuration(systemTile);
            this.generationProgress = new CooldownState(currentTime, currentTime + systemGenerationDuration);

            // Update cardGeneration on each crew system to show the full cycle duration.
            this.updateCrewSystemCardGeneration(currentTime);
        } else if (currentTime >= this.generationProgress.endTime) {
            // Generation complete: unmark and generate.
            systemTile.generating = false;
            systemTile.systemState.generate.invoke();

            // If a system has generationPriority, also trigger generation on it.
            const priorityTile = this.systems.find(t => t.hasEffect('generationPriority'));
            if (priorityTile && priorityTile !== systemTile) {
                priorityTile.systemState.generate.invoke();
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
     * cycle equals the currently-generating system's duration.
     */
    private updateCrewSystemCardGeneration(currentTime: number) {
        const sequence = EngineerState.generationSequence;
        const priorityTile = this.systems.find(t => t.hasEffect('generationPriority'));
        const totalDuration = this.getActiveCycleDuration(priorityTile);

        // Priority system generates after every slot, so its cycle equals the currently-generating system's duration.
        if (priorityTile) {
            const crewSystem = priorityTile.systemState;
            if (crewSystem instanceof CrewSystemState) {
                const currentTile = this.getSequenceTile();
                if (currentTile) {
                    const currentTileDuration = this.getGenerationDuration(currentTile);
                    crewSystem.cardGeneration = null;
                    crewSystem.cardGeneration = new CooldownState(currentTime, currentTime + currentTileDuration);
                }
            }
        }

        // Set cardGeneration for each non-priority system based on the cumulative
        // duration of the active systems ahead of it in the sequence.
        let cardArrival = currentTime;
        for (let offset = 0; offset < sequence.length; offset++) {
            const tile = this.getSequenceTile(offset);
            if (!tile || tile === priorityTile) {
                continue;
            }

            cardArrival += this.getGenerationDuration(tile);

            const crewSystem = tile.systemState;
            if (crewSystem instanceof CrewSystemState) {
                crewSystem.cardGeneration = null;
                crewSystem.cardGeneration = new CooldownState(cardArrival - totalDuration, cardArrival);
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
        const currentTime = this.getGameState().currentTime;

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

        // Sum the generation durations of active systems between the one currently
        // generating (already accounted for by generationEndTime) and this tile's turn.
        let durationUntilGeneration = 0;
        for (let offset = 1; offset < sequence.length; offset++) {
            const candidate = this.getSequenceTile(offset);
            if (!candidate || candidate === priorityTile) {
                continue;
            }

            durationUntilGeneration += this.getGenerationDuration(candidate);
            if (candidate === tile) {
                break;
            }
        }

        crewSystem.cardGeneration.rescaleToEnd(currentTime, generationEndTime + durationUntilGeneration);
    }

    /**
     * Get the tile at a given offset from the system currently up next in the generation sequence.
     */
    private getSequenceTile(offsetFromCurrent: number = 0): EngineerSystemTile | undefined {
        const sequence = EngineerState.generationSequence;
        const seqIndex = (this.generationSequenceIndex + offsetFromCurrent) % sequence.length;
        return this.systems[sequence[seqIndex]];
    }

    /** Get a system tile's current generation duration. */
    private getGenerationDuration(tile: EngineerSystemTile): number {
        return tile.systemState.generationDuration.invoke();
    }

    /** Sum the generation durations of all active (non-priority) systems, i.e. one full generation cycle. */
    private getActiveCycleDuration(priorityTile: EngineerSystemTile | undefined): number {
        return this.systems
            .filter(tile => tile !== priorityTile)
            .reduce((sum, tile) => sum + this.getGenerationDuration(tile), 0);
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

    /**
     * Play a card from the hand by moving it to the discard pile.
     * Ensures that all requirements are met before playing.
     * Returns the card if found and played, null otherwise.
     */
    override playCard(cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string): EngineCardDefinition | null {
        const cardIndex = this.hand.findIndex(card => card.id === cardId);
        if (cardIndex === -1) {
            console.warn('card not found');
            return null;
        }

        if (targetType === 'system' && targetId === 'repair') {
            const card = this.hand[cardIndex];

            let cardDefinition = getCardDefinition(card.type);

            if ((cardDefinition.traits ?? []).includes('expendable')) {
                // Expendable cards can't be used for repairs.
                return null;
            }

            this.repairCapacity = Math.min(this.repairCapacity + 10, this.maxRepairCapacity);

            this.handlePlayedCard(card, cardIndex, false);

            return cardDefinition;
        } else {
            return super.playCard(cardId, cardType, targetType, targetId);
        }
    }

    override playSystemCard(cardDefinition: EngineSystemTargetCardDefinition, targetId: string, parameters: CardParameters): boolean {
        const systemId = targetId as ShipSystem;
        const systemTile = this.systems.find(s => s.system === systemId);

        if (!systemTile || !cardDefinition.play(this.getGameState(), this.getShip(), systemTile, parameters)) {
            console.log('card refused to play');
            return false;
        }

        return true;
    }

    /* Repair the specified system, consuming repair capacity. */
    repair(system: ShipSystem) {
        const systemState = this.getShip().getSystem(system);
        if (!systemState) {
            console.warn(`System ${system} not found on ship ${this.getShip().id}`);
            return;
        }

        const repairAmount = Math.min(systemState.maxHealth - systemState.health, this.repairCapacity);
        if (repairAmount > 0) {
            systemState.adjustHealth(repairAmount);
            this.repairCapacity -= repairAmount;
        }
    }
}

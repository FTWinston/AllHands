import { IArray } from '@colyseus/react';
import { ArraySchema, Schema, type } from '@colyseus/schema';
import { LeveledSystemEffectType, NonLeveledSystemEffectType, SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { SystemInfo, SystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getArrayValue } from 'common-data/utils/arrays';
import { InterceptableAction } from 'src/classes/InterceptableAction';
import { InterceptableGetter } from 'src/classes/InterceptableGetter';
import { InterceptableSetter } from 'src/classes/InterceptableSetter';
import { CardState } from '../CardState';
import { GameState } from '../GameState';
import { SystemEffect } from './engineer/SystemEffect';
import type { Ship } from '../Ship';
import type { EngineerSystemTile } from './engineer/EngineerSystemTile';

/**
 * Maps the reactor's power level to the per-system generation duration (ms).
 */
export const generationDurationByReactorPower = [8_000, 4_000, 2_000, 1_000, 500, 250];

export abstract class SystemState extends Schema implements SystemInfo {
    constructor(
        setup: SystemSetupInfo,
        protected readonly _gameState: GameState,
        protected readonly _ship: Ship,
        cards: CardState[],
        initialHandSize: number
    ) {
        super();

        this.underlyingPowerLevel = this.powerLevel = setup.initialPowerLevel;
        this.maxPowerLevel = setup.maxPowerLevel;

        // The first initialHandSize cards go straight into the hand.
        this.hand = new ArraySchema<CardState>(
            ...cards.slice(0, initialHandSize)
        );

        // All remaining cards form the deck.
        this.deck = new ArraySchema<CardState>(
            ...cards.slice(initialHandSize)
        );

        this.health = this.maxHealth = this.initializeCardPool(cards);
    }

    /**
     * Cards held by this system. Only populated for crew systems (see CrewSystemState); other
     * systems (hull, reactor) leave these empty and use a plain numeric health/maxHealth instead.
     */
    @type([CardState]) hand = new ArraySchema<CardState>();
    @type([CardState]) deck = new ArraySchema<CardState>();

    /** Get the game state this system belongs to. */
    getGameState(): GameState {
        return this._gameState;
    }

    /** Get the ship this system belongs to. */
    getShip(): Ship {
        return this._ship;
    }

    private _linkedEngineerSystemTile?: EngineerSystemTile;

    protected get linkedEngineerSystemTile(): EngineerSystemTile {
        if (this._linkedEngineerSystemTile) {
            return this._linkedEngineerSystemTile;
        } else {
            throw new Error('This system is not linked to an engineer system tile');
        }
    }

    /**
     * Link this system to an EngineerSystemTile so that power, health,
     * and effect changes are automatically propagated.
     */
    linkEngineerSystem(engineerSystem: EngineerSystemTile) {
        this._linkedEngineerSystemTile = engineerSystem;
    }

    private underlyingPowerLevel: number;
    @type('uint8') readonly powerLevel: number;
    maxPowerLevel: number;

    readonly health: number;
    maxHealth: number;

    /**
     * Any attacks targeting this system will have their chance to hit modified by this percentage.
     * TODO: make use of this!
     */
    chanceToHitPercentageModifier: number = 0;

    /**
     * This system's damageable cards, wherever they physically are (hand, deck, or a slot).
     * Cards with the expendable trait are never included: they don't affect health and can't be damaged.
     */
    protected readonly cardPool = new Set<CardState>();

    /**
     * Undamaged pool cards, in the order they'll be damaged next. Cards currently occupying a
     * slot are kept after lastUnslottedIndex, so they're only damaged once every other card already is.
     */
    private readonly damageQueue: CardState[] = [];
    private lastUnslottedIndex = 0;

    /** Damaged pool cards, in the order they'll be repaired next. */
    private readonly repairQueue: CardState[] = [];

    /** Pool cards currently occupying a system-specific slot. */
    private readonly slottedCards = new Set<CardState>();

    /**
     * Populate this system's card pool from its underlying cards (skipping expendable ones),
     * and returning the number of cards in the pool, which is also the max health.
     */
    private initializeCardPool(cards: readonly CardState[]): number {
        for (const card of cards) {
            if (card.hasTrait('expendable')) {
                continue;
            }

            this.cardPool.add(card);
            this.damageQueue.push(card);
        }

        this.lastUnslottedIndex = this.damageQueue.length;

        return this.cardPool.size;
    }

    /**
     * Mark a pool card as occupying a slot, so it's only damaged as a last resort. No-op for
     * cards outside this system's pool (e.g. expendable cards).
     */
    protected markCardSlotted(card: CardState) {
        if (!this.cardPool.has(card) || this.slottedCards.has(card)) {
            return;
        }
        this.slottedCards.add(card);

        const index = this.damageQueue.indexOf(card);
        if (index === -1) {
            // Already damaged (in the repair queue); it'll land in the slotted section once repaired.
            return;
        }

        this.damageQueue.splice(index, 1);
        if (index < this.lastUnslottedIndex) {
            this.lastUnslottedIndex--;
        }
        this.damageQueue.push(card);
    }

    /**
     * Mark a pool card as no longer occupying a slot, randomly repositioning it among the other
     * undamaged cards. No-op for cards outside this system's pool.
     */
    protected markCardUnslotted(card: CardState) {
        if (!this.slottedCards.delete(card)) {
            return;
        }

        const index = this.damageQueue.indexOf(card);
        if (index === -1) {
            // Already damaged (in the repair queue); it'll be randomly positioned once repaired.
            return;
        }

        this.damageQueue.splice(index, 1);
        this.insertUnslotted(card);
    }

    /** Insert a card at a random position among the not-yet-slotted section of the damage queue. */
    private insertUnslotted(card: CardState) {
        const index = this.getGameState().random.getInt(this.lastUnslottedIndex + 1);
        this.damageQueue.splice(index, 0, card);
        this.lastUnslottedIndex++;
    }

    /**
     * Recompute health from the damage queue, and propagate the change to the linked engineer system.
     */
    private syncHealth() {
        (this as { health: number }).health = this.damageQueue.length;
        this.linkedEngineerSystemTile.setHealthFromSystem(this);
    }

    /**
     * Adjust health by randomly damaging (negative) or repairing (positive) that many cards.
     * Slotted cards are only damaged once every other pool card is already damaged.
     */
    adjustHealth(adjustment: number) {
        const amount = Math.round(adjustment);

        if (amount < 0) {
            this.damageCards(-amount);
        } else if (amount > 0) {
            this.repairCards(amount);
        }
    }

    private damageCards(count: number) {
        for (let i = 0; i < count; i++) {
            const card = this.damageQueue.shift();
            if (!card) {
                break;
            }

            if (this.lastUnslottedIndex > 0) {
                this.lastUnslottedIndex--;
            }

            card.damaged = true;
            this.getGameState().random.insert(this.repairQueue, card);
        }

        this.syncHealth();
    }

    private repairCards(count: number) {
        for (let i = 0; i < count; i++) {
            const card = this.repairQueue.shift();
            if (!card) {
                break;
            }

            card.damaged = false;

            if (this.slottedCards.has(card)) {
                this.damageQueue.push(card);
            } else {
                this.insertUnslotted(card);
            }
        }

        this.syncHealth();
    }

    /**
     * Adjust the power level, keeping it within bounds and propagating the change to the linked engineer system.
     */
    adjustPowerLevel(adjustment: number) {
        // Keep an "underlying" value so that effects that would adjust below 0 or above max can still be tracked and properly reversed when they effect expire.
        this.underlyingPowerLevel += adjustment;

        // The "proper" value is always clamped to within the allowed bounds.
        (this as { powerLevel: number }).powerLevel = Math.max(0, Math.min(this.underlyingPowerLevel, this.maxPowerLevel));

        this.linkedEngineerSystemTile.setPowerLevelFromSystem(this);
    }

    /**
     * Get the effects currently applied to this system.
     */
    getEffects(): IArray<SystemEffect> {
        return this.linkedEngineerSystemTile.effects;
    }

    /**
     * Add an effect to this system.
     */
    addEffect(effectType: NonLeveledSystemEffectType) {
        this.linkedEngineerSystemTile.addEffect(effectType);
    }

    /**
     * Remove a specific effect from this system.
     * Returns true if the effect was found and removed.
     */
    removeEffect(effect: SystemEffectType, early: boolean): boolean {
        return this.linkedEngineerSystemTile.removeEffect(effect, early);
    }

    adjustEffectLevel(effect: LeveledSystemEffectType, adjustment: number | undefined) {
        return this.linkedEngineerSystemTile.adjustEffectLevel(effect, adjustment);
    }

    hasEffect(effectType: SystemEffectType): boolean {
        return this.linkedEngineerSystemTile.hasEffect(effectType);
    }

    get shieldPassThroughModifier(): number {
        return this.linkedEngineerSystemTile.shieldPassThroughModifier;
    }

    /**
     * Get the generation duration for this system, based on the current reactor power level.
     * Update the engineer system's generation progress when any handler changes this.
     */
    public readonly generationDuration = new InterceptableGetter<number>(() => {
        let reactorPower = this.getShip().reactorState.powerLevel;
        return getArrayValue(generationDurationByReactorPower, reactorPower);
    }, () => this.getShip().engineerState.onGenerationDurationChanged());

    /**
     * Generate (e.g. a card) for this system.
     * Base SystemState does nothing; subclasses can override.
     */
    public abstract readonly generate: InterceptableAction;

    /**
     * Adjust health on account of receiving damage.
     */
    public readonly applyDamage = new InterceptableSetter<number>((amount: number) => {
        this.adjustHealth(-Math.round(amount));
    });

    /**
     * Adjust the cost of every card associated with this system.
     * Base SystemState does nothing; CrewSystemState overrides and its subclasses can override further.
     */
    adjustCostOfEveryCard(_amount: number) {}
}

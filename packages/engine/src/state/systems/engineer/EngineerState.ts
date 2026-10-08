import { ArraySchema, type } from '@colyseus/schema';
import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { SystemSetupInfo, EngineerSystemInfo } from 'common-data/features/space/types/GameObjectInfo';
import { EngineCardDefinition, EngineSystemTargetCardDefinition } from 'src/cards/EngineCardDefinition';
import { getCardDefinition } from 'src/cards/getEngineCardDefinition';
import { getReactorCardTypeForSystem } from 'src/cards/getReactorCardTypeForSystem';
import { getSystemEffectDefinition } from 'src/effects/getEngineSystemEffectDefinition';
import { GameState } from 'src/state/GameState';
import { CrewSystemState } from '../CrewSystemState';
import { EngineerSystemTile } from './EngineerSystemTile';
import type { Ship } from 'src/state/Ship';

export class EngineerState extends CrewSystemState implements EngineerSystemInfo {
    constructor(setup: SystemSetupInfo, gameState: GameState, ship: Ship, scannedSystemIndex: number, initialPowerLevel: number, getCardId: () => number) {
        super(setup, 'engineer', gameState, ship, scannedSystemIndex, initialPowerLevel, getCardId);
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

    override updateCardGeneration() {
        super.updateCardGeneration();

        const topCardType = this.getShip().reactorState.deck[0]?.type;
        for (const tile of this.systems) {
            tile.generating = getReactorCardTypeForSystem(tile.system) === topCardType;
        }
    }

    update(currentTime: number) {
        this.removeExpiredEffects(currentTime);
        this.processEffectTicks(currentTime);
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
     * Play a card from the hand by moving it to the end of the deck.
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

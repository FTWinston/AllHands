import { ArraySchema, type } from '@colyseus/schema';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType, WeaponSlotTargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import { TacticalSystemInfo, TacticalSystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { EngineCardDefinition } from 'src/cards/EngineCardDefinition';
import { getCardDefinition } from '../cards/getEngineCardDefinition';
import { CrewSystemState } from './CrewSystemState';
import { GameObject } from './GameObject';
import { GameState } from './GameState';
import { TacticalTargetState } from './TacticalTargetState';
import { WeaponSlotState } from './WeaponSlotState';
import type { Ship } from './Ship';

export class TacticalState extends CrewSystemState implements TacticalSystemInfo {
    constructor(setup: TacticalSystemSetupInfo, gameState: GameState, ship: Ship, getCardId: () => number) {
        super(setup, gameState, ship, getCardId);

        for (let i = 0; i < setup.numSlots; i++) {
            this.slots.push(new WeaponSlotState(`slot${i + 1}`));
        }
    }

    @type([TacticalTargetState]) targets = new ArraySchema<TacticalTargetState>();
    @type([WeaponSlotState]) slots = new ArraySchema<WeaponSlotState>();

    update(_currentTime: number) {
    }

    override playCard(cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string): EngineCardDefinition | null {
        // If the card being played is one in a weapon slot, give that special handling.
        if (targetType === 'enemy') {
            for (const slot of this.slots) {
                if (cardId === slot.card?.id) {
                    return this.playWeapon(slot, cardType as WeaponSlotTargetedCardType, targetId);
                }
            }
        }

        return super.playCard(cardId, cardType, targetType, targetId);
    }

    playWeapon(slot: WeaponSlotState, cardType: WeaponSlotTargetedCardType, targetId: string): EngineCardDefinition | null {
        const cardDef = getCardDefinition(cardType);

        const target = this.resolveTarget(targetId);

        if (target) {
            cardDef.fire(this.getGameState(), this.getShip(), target, slot.getParameters());
        } else {
            console.warn(`target not found: ${targetId}`);
        }

        this.handlePlayedWeapon(slot, cardDef);

        return cardDef;
    }

    resolveWeaponSlot(slotId: string): WeaponSlotState | null {
        for (const slot of this.slots) {
            if (slot.id === slotId) {
                return slot;
            }
        }
        return null;
    }

    private handlePlayedWeapon(slot: WeaponSlotState, cardDef: EngineCardDefinition) {
        if (!slot.card) {
            return;
        }

        slot.charge = 0;
        slot.primed = false;

        if (slot.getParameter('uses') <= 1) {
            // Put card back into discard pile.
            this.handlePlayedCard(slot.card, -1, cardDef);

            slot.card = null;
            slot.modifiers.clear();
            slot.noFireReason = null;
        } else {
            slot.adjustParameter('uses', -1);
        }
    }

    addTarget(id: string, object: GameObject) {
        /*
        if (false) {
            // TODO: determine if this is a valid target.
            return;
        }
        */

        this.targets.push(new TacticalTargetState(id, 'Some object', object.appearance));
    }

    removeTarget(id: string) {
        const index = this.targets.findIndex(target => target.id === id);
        if (index !== -1) {
            this.targets.splice(index, 1);
        }
    }
}

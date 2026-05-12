import { ArraySchema, MapSchema, type } from '@colyseus/schema';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType, WeaponSlotTargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import { FiringState } from 'common-data/features/space/types/FiringState';
import { TacticalSystemInfo, TacticalSystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getFiringSolution } from 'common-data/features/space/utils/getFiringSolution';
import { getFiringState } from 'common-data/features/space/utils/getFiringState';
import { EngineCardDefinition } from 'src/cards/EngineCardDefinition';
import { getCardDefinition } from '../cards/getEngineCardDefinition';
import { CrewSystemState } from './CrewSystemState';
import { GameState } from './GameState';
import { Ship } from './Ship';
import { TargetVulnerabilitiesState } from './TargetVulnerabilitiesState';
import { WeaponSlotState } from './WeaponSlotState';

export class TacticalState extends CrewSystemState implements TacticalSystemInfo {
    constructor(setup: TacticalSystemSetupInfo, gameState: GameState, ship: Ship, getCardId: () => number) {
        super(setup, gameState, ship, getCardId);

        for (let i = 0; i < setup.numSlots; i++) {
            this.slots.push(new WeaponSlotState(`slot${i + 1}`));
        }
    }

    @type({ map: TargetVulnerabilitiesState }) vulnerabilitiesByTarget = new MapSchema<TargetVulnerabilitiesState>();
    @type([WeaponSlotState]) slots = new ArraySchema<WeaponSlotState>();

    update(currentTime: number) {
        for (const slot of this.slots) {
            slot.update(currentTime);
        }
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
        const splitPos = targetId.indexOf(':');
        let targetObjectId: string;
        // let _targetVulnerability: string | null;

        if (splitPos !== -1) {
            targetObjectId = targetId.substring(0, splitPos);
            // _targetVulnerability = targetId.substring(splitPos + 1);
        } else {
            targetObjectId = targetId;
            // _targetVulnerability = null;
        }

        const target = this.resolveTarget(targetObjectId);

        if (!target) {
            console.warn(`target not found: ${targetId}`);
            return null;
        }

        // TODO use targetVulnerability!

        const cardDef = getCardDefinition(cardType);
        const currentTime = this.getGameState().clock.currentTime;
        const slotParameters = slot.getParameters();
        const firingSolution = getFiringSolution(this.getShip().motion, target.motion, currentTime);
        const firingState = getFiringState(firingSolution, slot.primed, slot.charge, slotParameters);

        if (firingState !== FiringState.CanFire) {
            console.warn(`cannot fire: firingState=${firingState}`);
            return null;
        }

        cardDef.fire(this.getGameState(), this.getShip(), target, slotParameters);

        if (slot.card && slot.afterFiring()) {
            // Put card back into discard pile.
            this.handlePlayedCard(slot.card, -1, cardDef);
        }

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
}

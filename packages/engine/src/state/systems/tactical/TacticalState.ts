import { ArraySchema, MapSchema, type } from '@colyseus/schema';
import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType, WeaponSlotTargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import { FiringState } from 'common-data/features/space/types/FiringState';
import { TacticalSystemInfo, TacticalSystemSetupInfo, VulnerabilityInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getFiringSolution } from 'common-data/features/space/utils/getFiringSolution';
import { getFiringState } from 'common-data/features/space/utils/getFiringState';
import { EngineCardDefinition, EngineWeaponSlotCardDefinition, EngineWeaponTargetCardDefinition } from 'src/cards/EngineCardDefinition';
import { getCardDefinition } from 'src/cards/getEngineCardDefinition';
import { CardState } from 'src/state/CardState';
import { GameState } from 'src/state/GameState';
import { Ship } from 'src/state/Ship';
import { CrewSystemState } from '../CrewSystemState';
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

    override playWeaponSlotCard(cardDefinition: EngineWeaponSlotCardDefinition, card: CardState, targetId: string, parameters: CardParameters): boolean {
        const slot = this.resolveWeaponSlot(targetId);

        if (!slot) {
            console.warn('weapon slot not found: ' + targetId);
            return false;
        }

        if (slot.card) {
            console.log('weapon slot already occupied');
            return false;
        }

        if (!cardDefinition.load(this.getGameState(), this.getShip(), slot, parameters)) {
            console.log('card refused to load');
            return false;
        }

        slot.card = card;
        this.scienceScanDataChanged.trigger();

        return true;
    }

    protected playWeaponCard(cardDefinition: EngineWeaponTargetCardDefinition, targetId: string, parameters: CardParameters): boolean {
        const slot = this.resolveWeaponSlot(targetId);
        if (!slot) {
            console.warn('weapon slot not found: ' + targetId);
            return false;
        }

        if (!slot.card) {
            console.log('weapon slot is empty');
            return false;
        }

        // If slot has been primed, use the card's charge function.
        // Otherwise, use the card's prime function, and mark the slot as primed.
        if (slot.primed) {
            if (!cardDefinition.charge(this.getGameState(), this.getShip(), slot, parameters)) {
                console.log('card refused to charge');
                return false;
            }
        } else {
            if (!cardDefinition.prime(this.getGameState(), this.getShip(), slot, parameters)) {
                console.log('card refused to prime');
                return false;
            }

            slot.primed = true;
        }

        this.scienceScanDataChanged.trigger();
        return true;
    }

    playWeapon(slot: WeaponSlotState, cardType: WeaponSlotTargetedCardType, targetId: string): EngineCardDefinition | null {
        const splitPos = targetId.indexOf(':');
        let targetObjectId: string;
        let vulnerabilityId: string | null;

        if (splitPos !== -1) {
            targetObjectId = targetId.substring(0, splitPos);
            vulnerabilityId = targetId.substring(splitPos + 1);
        } else {
            targetObjectId = targetId;
            vulnerabilityId = null;
        }

        const target = this.resolveTarget(targetObjectId);

        if (!target) {
            console.warn(`target not found: ${targetId}`);
            return null;
        }

        let vulnerability: VulnerabilityInfo | undefined;
        if (vulnerabilityId !== null) {
            const targetVulnerabilities = this.vulnerabilitiesByTarget.get(targetId);
            if (!targetVulnerabilities) {
                console.warn(`vulnerabilities not found for target: ${targetId}`);
                return null;
            }
            vulnerability = targetVulnerabilities.vulnerabilities.find(vuln => vuln.type === vulnerabilityId);
            if (!vulnerability) {
                console.warn(`vulnerability not found for target: ${targetId}, vulnerabilityId: ${vulnerabilityId}`);
                return null;
            }
        }

        const cardDef = getCardDefinition(cardType);
        const currentTime = this.getGameState().currentTime;
        const slotParameters = slot.getParameters();
        const firingSolution = getFiringSolution(this.getShip().motion, target.motion, currentTime);
        const firingState = getFiringState(firingSolution, slot.primed, slot.charge, slotParameters, vulnerability);

        if (firingState !== FiringState.CanFire) {
            console.warn(`cannot fire: firingState=${firingState}`);
            return null;
        }

        cardDef.fire(this.getGameState(), this.getShip(), target, slotParameters);

        if (slot.card && slot.afterFiring()) {
            // Put card back into discard pile.
            this.handlePlayedCard(slot.card, -1, cardDef, false);
        }

        this.scienceScanDataChanged.trigger();
        return cardDef;
    }

    private resolveWeaponSlot(slotId: string): WeaponSlotState | null {
        for (const slot of this.slots) {
            if (slot.id === slotId) {
                return slot;
            }
        }
        return null;
    }
}

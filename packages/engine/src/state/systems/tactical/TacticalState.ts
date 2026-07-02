import { ArraySchema, MapSchema, type } from '@colyseus/schema';
import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType, WeaponSlotTargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { FiringState } from 'common-data/features/space/types/FiringState';
import { TacticalSystemInfo, TacticalSystemSetupInfo, SubTargetInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getFiringSolution } from 'common-data/features/space/utils/getFiringSolution';
import { getFiringState } from 'common-data/features/space/utils/getFiringState';
import { EngineCardDefinition, EngineWeaponSlotCardDefinition, EngineWeaponTargetCardDefinition } from 'src/cards/EngineCardDefinition';
import { getCardDefinition } from 'src/cards/getEngineCardDefinition';
import { CardState } from 'src/state/CardState';
import { GameState } from 'src/state/GameState';
import { Ship } from 'src/state/Ship';
import { CrewSystemState } from '../CrewSystemState';
import { SubTargetState } from './SubTargetState';
import { TargetSubTargetsState } from './TargetSubTargetsState';
import { WeaponSlotState } from './WeaponSlotState';

export class TacticalState extends CrewSystemState implements TacticalSystemInfo {
    constructor(setup: TacticalSystemSetupInfo, gameState: GameState, ship: Ship, scannedSystemIndex: number, getCardId: () => number) {
        super(setup, gameState, ship, scannedSystemIndex, getCardId);

        for (let i = 0; i < setup.numSlots; i++) {
            this.slots.push(new WeaponSlotState(`slot${i + 1}`));
        }
    }

    @type({ map: TargetSubTargetsState }) subTargetsByTarget = new MapSchema<TargetSubTargetsState>();
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

        let subTarget: SubTargetInfo | undefined;
        if (vulnerabilityId !== null) {
            const targetSubTargets = this.subTargetsByTarget.get(targetObjectId);
            if (!targetSubTargets) {
                console.warn(`sub-targets not found for target: ${targetObjectId}`);
                return null;
            }
            subTarget = targetSubTargets.subTargets.find(st => st.id === vulnerabilityId);
            if (!subTarget) {
                console.warn(`sub-target not found for target: ${targetObjectId}, id: ${vulnerabilityId}`);
                return null;
            }
        }

        const cardDef = getCardDefinition(cardType);
        const currentTime = this.getGameState().currentTime;
        const slotParameters = slot.getParameters();
        const firingSolution = getFiringSolution(this.getShip().motion, target.motion, currentTime);
        const firingState = getFiringState(firingSolution, slot.primed, slot.charge, slotParameters, subTarget);

        if (firingState !== FiringState.CanFire) {
            console.warn(`cannot fire: firingState=${firingState}`);
            return null;
        }

        /*
        const ownHelm = this.getShip().helmState;
        const ownEvasion = ownHelm.activeManeuver?.card?.getParameter('evasion') ?? 0;
        const accuracy = 100 - ownEvasion;
        */
        const accuracy = 100; // TODO: consider what can reduce (or improve) accuracy, such as evasion, damage, etc.

        cardDef.fire(this.getGameState(), this.getShip(), target, slotParameters, accuracy);

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

    /**
     * Called by ScienceState when it identifies systems on a target ship.
     * Syncs one system sub-target per identified ShipSystem in subTargetsByTarget.
     */
    setSystemSubTargets(targetId: string, systems: ShipSystem[]): void {
        if (systems.length === 0) {
            const entry = this.subTargetsByTarget.get(targetId);
            if (entry) {
                entry.subTargets.splice(0, entry.subTargets.length);
            }
            return;
        }

        if (!this.subTargetsByTarget.has(targetId)) {
            this.subTargetsByTarget.set(targetId, new TargetSubTargetsState());
        }
        const entry = this.subTargetsByTarget.get(targetId)!;

        // Remove any system sub-targets no longer in the identified set.
        for (let i = entry.subTargets.length - 1; i >= 0; i--) {
            if (!systems.includes(entry.subTargets[i].system as ShipSystem)) {
                entry.subTargets.splice(i, 1);
            }
        }

        // Add newly identified systems.
        for (const system of systems) {
            if (!entry.subTargets.some(st => st.id === system)) {
                entry.subTargets.push(new SubTargetState(system, system));
            }
        }
    }
}

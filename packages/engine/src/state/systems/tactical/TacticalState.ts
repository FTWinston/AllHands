import { ArraySchema, MapSchema, type } from '@colyseus/schema';
import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { WeaponTrait } from 'common-data/features/cards/types/CardTrait';
import { CardType, WeaponSlotTargetedCardType, cardDefinitions } from 'common-data/features/cards/utils/cardDefinitions';
import { crewRoleNames } from 'common-data/features/ships/types/CrewRole';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { SystemEffectCategory } from 'common-data/features/ships/types/SystemEffectDefinition';
import { FiringState } from 'common-data/features/space/types/FiringState';
import { TacticalSystemInfo, TacticalSystemSetupInfo, SubTargetInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getFiringSolution } from 'common-data/features/space/utils/getFiringSolution';
import { getFiringState } from 'common-data/features/space/utils/getFiringState';
import { isWeaponTrait } from 'src/cards/applyWeaponTrait';
import { EngineCardDefinition, EngineEnemyTargetCardDefinition, EngineWeaponSlotCardDefinition, EngineWeaponTargetCardDefinition } from 'src/cards/EngineCardDefinition';
import { getCardDefinition } from 'src/cards/getEngineCardDefinition';
import { getSystemEffectDefinition } from 'src/effects/getEngineSystemEffectDefinition';
import { CardState } from 'src/state/CardState';
import { GameObject } from 'src/state/GameObject';
import { GameState } from 'src/state/GameState';
import { SensorGhost } from 'src/state/SensorGhost';
import { Ship } from 'src/state/Ship';
import { CrewSystemState } from '../CrewSystemState';
import { SubTargetState } from './SubTargetState';
import { TargetSubTargetsState } from './TargetSubTargetsState';
import { WeaponSlotState } from './WeaponSlotState';

/** Game-time delay between each shot of a multi-shot weapon, in ms. */
const extraShotDelay = 200;

/** Percentage points of accuracy that every shot at the locked ship gains, for each level of Lock. */
export const lockAccuracyPerLevel = 10;

/** How long after Lock was last gained it fades by a level, and then by each further level, in ms. */
export const lockFadeInterval = 8000;

export class TacticalState extends CrewSystemState implements TacticalSystemInfo {
    constructor(setup: TacticalSystemSetupInfo, gameState: GameState, ship: Ship, scannedSystemIndex: number, initialPowerLevel: number, getCardId: () => number) {
        super(setup, 'tactical', gameState, ship, scannedSystemIndex, initialPowerLevel, getCardId);

        for (let i = 0; i < setup.numSlots; i++) {
            const slot = new WeaponSlotState(`slot${i + 1}`);
            slot.onDeactivated = (card, targetId) => this.weaponDeactivated(card, targetId);
            this.slots.push(slot);
        }
    }

    @type({ map: TargetSubTargetsState }) subTargetsByTarget = new MapSchema<TargetSubTargetsState>();
    @type([WeaponSlotState]) slots = new ArraySchema<WeaponSlotState>();

    /** The id of the ship that Lock is held against. Empty while there's no Lock. */
    @type('string') lockTargetId = '';

    /** The level of the `lock` effect on this system, which sets it (see `lockLevelChanged`). Held here too as tactical's own client can't see the system's effects. */
    @type('uint8') lockLevel = 0;

    /** When Lock next fades by a level. Null while there's no Lock. */
    private lockFadeTime: number | null = null;

    /** Whether weapons can't fire just now, as the Hold Fire card says (see `holdFire`). Synced so that tactical's client can say so. */
    @type('boolean') holdingFire = false;

    /** The ship that was locked when Hold Fire was played, which gets the Lock it gives once it ends. */
    private holdFireTargetId = '';

    /** Whether the helm is holding the ship steady, so that cumbersome weapons needn't hold their aim. Synced, as tactical's client can't see the helm's effects. */
    @type('boolean') aimSteadied = false;

    /** The ship that every crew system can be aimed at, as the Called Shot card says (see `callShot`). Empty while there's none. */
    private calledShotTargetId = '';

    /** The systems that science has identified on each ship, which can be aimed at (see `setSystemSubTargets`). */
    private readonly identifiedSystems = new Map<string, ShipSystem[]>();

    update(currentTime: number) {
        this.updateAim(currentTime);

        for (const slot of this.slots) {
            const slotCard = slot.card;
            if (slot.update(currentTime) && slotCard) {
                this.discardSlotCard(slotCard);
            } else if (slotCard && slot.isActive && !this.canStayActive(slot, slotCard)) {
                slot.clear();
                this.discardSlotCard(slotCard);
                this.scienceScanDataChanged.invoke();
            }
        }

        this.updateLock(currentTime);
    }

    /**
     * Keep track of which ships each cumbersome weapon has in its firing arc and range, and since when: a ship that leaves either starts over when it's back.
     * Every ship known to this one is tracked, as which one is being aimed at is up to tactical's client.
     */
    private updateAim(currentTime: number) {
        const ship = this.getShip();
        const gameState = this.getGameState();
        this.aimSteadied = ship.helmState.hasEffect('holdingSteady');

        for (const slot of this.slots) {
            if (!slot.card?.hasTrait('cumbersome')) {
                if (slot.aimStartTimes.size > 0) {
                    slot.aimStartTimes.clear();
                }
                continue;
            }

            const parameters = slot.getParameters();
            const inPosition = new Set<string>();

            for (const objectId of ship.knownObjects) {
                const object = gameState.objects.get(objectId);
                if (!object || object === ship) {
                    continue;
                }

                // Charge doesn't matter here, so the weapon is taken to be charged.
                const solution = getFiringSolution(ship.motion, object.motion, currentTime);
                if (getFiringState(solution, true, parameters['chargePerUse'] ?? 1, parameters) === FiringState.CanFire) {
                    inPosition.add(objectId);
                }
            }

            for (const objectId of [...slot.aimStartTimes.keys()]) {
                if (!inPosition.has(objectId)) {
                    slot.aimStartTimes.delete(objectId);
                }
            }

            for (const objectId of inPosition) {
                if (!slot.aimStartTimes.has(objectId)) {
                    slot.aimStartTimes.set(objectId, currentTime);
                }
            }
        }
    }

    /**
     * How long a weapon's target has been held in its firing arc and range, in ms, if the weapon has to hold its aim before it can fire (a cumbersome one).
     * Undefined for any other weapon, and for any while the helm is holding the ship steady.
     */
    getAimedFor(slot: WeaponSlotState, targetId: string): number | undefined {
        if (!slot.card?.hasTrait('cumbersome') || this.getShip().helmState.hasEffect('holdingSteady')) {
            return undefined;
        }

        const startTime = slot.aimStartTimes.get(targetId);
        return startTime === undefined ? 0 : this.getGameState().currentTime - startTime;
    }

    /**
     * Whether an active weapon can stay active: its target must still be known to this ship and within the weapon's range,
     * and the weapon's card mustn't say its hold is lost (see `holds`). It no longer needs to be in the firing arc.
     */
    private canStayActive(slot: WeaponSlotState, card: CardState): boolean {
        const target = this.resolveTarget(slot.activeTargetId);
        if (!target) {
            return false;
        }

        const { range } = getFiringSolution(this.getShip().motion, target.motion, this.getGameState().currentTime);
        if (range > slot.getParameter('maxRange')) {
            return false;
        }

        return getCardDefinition(card.type as WeaponSlotTargetedCardType).holds?.(this.getGameState(), this.getShip(), target) ?? true;
    }

    /**
     * Called as an active weapon stops being active, after its slot has been emptied: the weapon's card undoes what firing it started (see `release`).
     * Not if the other slot's weapon is the same, and still active on the same target, as that would undo its hold too.
     */
    private weaponDeactivated(card: CardState, targetId: string) {
        if (this.slots.some(slot => slot.isActive && slot.activeTargetId === targetId && slot.card?.type === card.type)) {
            return;
        }

        const gameState = this.getGameState();
        const target = gameState.objects.get(targetId) ?? null;
        getCardDefinition(card.type as WeaponSlotTargetedCardType).release?.(gameState, this.getShip(), target);
    }

    /**
     * Raise Lock against a ship by the given number of levels, up to the `lock` effect's most. Locking a different ship drops any Lock held against the last one first.
     * Returns false if no Lock was gained: the target isn't another ship, or Lock on it is already as high as it goes.
     */
    addLock(target: GameObject, levels: number): boolean {
        if (!(target instanceof Ship) || target === this.getShip() || levels <= 0) {
            return false;
        }

        if (this.lockTargetId !== target.id) {
            this.dropLock();
        }

        const previousLevel = this.lockLevel;
        this.adjustEffectLevel('lock', levels);

        if (this.lockLevel <= previousLevel) {
            return false;
        }

        this.lockTargetId = target.id;
        // Gaining Lock starts its time over.
        this.lockFadeTime = this.getGameState().currentTime + lockFadeInterval;
        return true;
    }

    /** Lose all Lock, and the ship it was held against. */
    dropLock() {
        // Removing the effect clears the level and the target (see `lockLevelChanged`). This also covers there being no effect to remove.
        this.removeEffect('lock', 'early');
        this.lockLevelChanged(0);
    }

    /** Called by the `lock` effect whenever its level changes, to keep this system's Lock in step with it. With no levels left, the locked ship is forgotten. */
    lockLevelChanged(level: number) {
        this.lockLevel = level;

        if (level <= 0) {
            this.lockTargetId = '';
            this.lockFadeTime = null;
        }
    }

    /** Lock is dropped once the locked ship is destroyed or out of sensor range, and fades a level each time `lockFadeInterval` passes without any being gained. */
    private updateLock(currentTime: number) {
        if (this.lockLevel <= 0) {
            return;
        }

        if (!this.resolveTarget(this.lockTargetId)) {
            this.dropLock();
            return;
        }

        if (this.lockFadeTime === null) {
            this.lockFadeTime = currentTime + lockFadeInterval;
        } else if (currentTime >= this.lockFadeTime) {
            this.lockFadeTime += lockFadeInterval;
            this.adjustEffectLevel('lock', -1);
        }
    }

    /** Discard the weapon in a slot, before it's used up. Its charge and any modifier are lost. */
    ejectWeapon(slotId: string): boolean {
        const slotCard = this.resolveWeaponSlot(slotId)?.clear();
        if (!slotCard) {
            return false;
        }

        this.discardSlotCard(slotCard);
        this.scienceScanDataChanged.invoke();
        return true;
    }

    /** A weapon that's damaged in its slot comes out of it, losing its charge and any modifier, as if ejected. */
    protected override cardDamaged(card: CardState) {
        const slot = this.slots.find(candidate => candidate.card === card);
        if (slot) {
            this.ejectWeapon(slot.id);
        }
    }

    /** Put a card that has left a weapon slot back at the end of the deck. */
    private discardSlotCard(card: CardState) {
        this.markCardUnslotted(card);
        this.handlePlayedCard(card, -1, false);
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

        slot.insertCard(card, this.getGameState().currentTime);
        this.markCardSlotted(card);
        this.scienceScanDataChanged.invoke();

        return true;
    }

    protected playWeaponCard(cardDefinition: EngineWeaponTargetCardDefinition, cardType: CardType, targetId: string, parameters: CardParameters): boolean {
        const slot = this.resolveWeaponSlot(targetId);
        if (!slot) {
            console.warn('weapon slot not found: ' + targetId);
            return false;
        }

        if (!slot.card) {
            console.log('weapon slot is empty');
            return false;
        }

        const { requiredWeaponTrait, instant } = cardDefinition;
        // An instant card can be played on any weapon. Anything else becomes its modifier, which it can only take one of, and an energised weapon none.
        if (!instant && !slot.canBeModified()) {
            console.log('weapon is already modified, or is energised');
            return false;
        }

        if (requiredWeaponTrait) {
            const weaponCardDef = cardDefinitions[slot.card.type] as EngineWeaponSlotCardDefinition;
            if (!weaponCardDef.traits?.includes(requiredWeaponTrait)) {
                console.warn(`card requires weapon with trait: ${requiredWeaponTrait}`);
                return false;
            }
        }

        if (!cardDefinition.prime(this.getGameState(), this.getShip(), slot, parameters)) {
            console.log('card refused to prime');
            return false;
        }

        // An instant card has done all it does, so the weapon is still free to take a modifier.
        if (!instant) {
            slot.modified = true;
            slot.modifierCard = cardType;
        }

        this.scienceScanDataChanged.invoke();
        return true;
    }

    /** A card played on a ship can be dropped on one of its sub-targets, which is taken as the ship itself. */
    protected override playEnemyCard(cardDefinition: EngineEnemyTargetCardDefinition, targetId: string, parameters: CardParameters): boolean {
        const splitPos = targetId.indexOf(':');
        return super.playEnemyCard(cardDefinition, splitPos === -1 ? targetId : targetId.substring(0, splitPos), parameters);
    }

    /**
     * Spend a hand card to charge a weapon slot by the card's power cost, or by its `chargeValue` parameter if it has one.
     * Only weapon and weapon slot cards can be spent this way.
     */
    chargeWeaponSlot(cardId: number, slotId: string): boolean {
        const slot = this.resolveWeaponSlot(slotId);
        if (!slot?.canBeCharged()) {
            return false;
        }

        const found = this.findCardForCapacity(cardId);
        if (!found || found.cost <= 0) {
            return false;
        }

        if (found.definition.targetType !== 'weapon' && found.definition.targetType !== 'weapon-slot') {
            return false;
        }

        slot.addCharge(found.card.getParameter('chargeValue') || found.cost, this.getGameState().currentTime);
        this.handlePlayedCard(found.card, found.cardIndex, false);
        this.scienceScanDataChanged.invoke();
        return true;
    }

    playWeapon(slot: WeaponSlotState, cardType: WeaponSlotTargetedCardType, targetId: string): EngineCardDefinition | null {
        if (this.holdingFire) {
            console.warn('cannot fire: holding fire');
            return null;
        }

        // With every tactical card damaged, the system is out. A damaged weapon has already left its slot, so this is a double check, which also covers one that can't be damaged, such as an expendable copy.
        if (this.health <= 0) {
            console.warn('cannot fire: tactical is out');
            return null;
        }

        if (slot.isActive) {
            console.warn('cannot fire: weapon is already active');
            return null;
        }

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

        const firingState = this.getSlotFiringState(slot, target, subTarget);

        if (firingState !== FiringState.CanFire) {
            console.warn(`cannot fire: firingState=${firingState}`);
            return null;
        }

        const cardDef = this.fireSlot(slot, cardType, target, subTarget, 0, false);

        this.scienceScanDataChanged.invoke();
        return cardDef;
    }

    /**
     * Fire every weapon that can fire at the locked ship, at once. Each does extra damage for every level of Lock, and is used up, whatever charge it had left.
     * All Lock is then spent. Returns how many weapons fired: if none could, nothing happens, and Lock is kept.
     * A weapon that stays active once fired (see `WeaponSlotState.staysActive`) holds its target rather than shooting it, so it isn't part of the volley.
     */
    fireVolley(damagePerLockLevel: number): number {
        const target = this.lockLevel > 0 ? this.resolveTarget(this.lockTargetId) : null;
        if (!target || this.health <= 0 || this.holdingFire) {
            return 0;
        }

        const extraDamage = this.lockLevel * damagePerLockLevel;
        let fired = 0;

        for (const slot of this.slots) {
            if (slot.card && !slot.staysActive && this.getSlotFiringState(slot, target, undefined) === FiringState.CanFire) {
                this.fireSlot(slot, slot.card.type as WeaponSlotTargetedCardType, target, undefined, extraDamage, true);
                fired++;
            }
        }

        if (fired > 0) {
            this.dropLock();
            this.scienceScanDataChanged.invoke();
        }

        return fired;
    }

    /**
     * Move all of one weapon's charge to another, up to what that one can hold: any more stays where it was.
     * A weapon left with no charge is used up, if it had been fully charged. Returns false if no charge could be moved.
     */
    moveCharge(fromSlotId: string, toSlotId: string): boolean {
        const from = this.resolveWeaponSlot(fromSlotId);
        const to = this.resolveWeaponSlot(toSlotId);
        const fromCard = from?.card;
        if (!from || !to || from === to || !fromCard) {
            return false;
        }

        const moved = to.receiveCharge(from.charge, this.getGameState().currentTime);
        if (moved <= 0) {
            return false;
        }

        if (from.removeCharge(moved)) {
            this.discardSlotCard(fromCard);
        }

        this.scienceScanDataChanged.invoke();
        return true;
    }

    /** The loaded weapon slot other than the given one. Null if there's no other weapon loaded. */
    getOtherLoadedSlot(slotId: string): WeaponSlotState | null {
        return this.slots.find(slot => slot.id !== slotId && slot.card !== null) ?? null;
    }

    private getSlotFiringState(slot: WeaponSlotState, target: GameObject, subTarget: SubTargetInfo | undefined): FiringState {
        const firingSolution = getFiringSolution(this.getShip().motion, target.motion, this.getGameState().currentTime);
        return getFiringState(firingSolution, slot.hasBeenFullyCharged, slot.charge, slot.getParameters(), subTarget, this.getAimedFor(slot, target.id));
    }

    /**
     * Fire the weapon in a slot at a target, without checking whether it can. Extra damage is added to each of its shots.
     * It then uses up one use's charge, or everything it has if it's emptying, in which case it's discarded.
     */
    private fireSlot(slot: WeaponSlotState, cardType: WeaponSlotTargetedCardType, target: GameObject, subTarget: SubTargetInfo | undefined, extraDamage: number, empties: boolean): EngineWeaponSlotCardDefinition {
        const cardDef = getCardDefinition(cardType);
        const currentTime = this.getGameState().currentTime;
        // Every shot lands on the system aimed at, if there is one.
        const targetSystem = subTarget?.system ?? null;
        extraDamage += this.getAimedDamageBonus(slot, target, targetSystem);

        const slotParameters = extraDamage
            ? { ...slot.getParameters(), damage: slot.getParameter('damage') + extraDamage }
            : slot.getParameters();

        const slotCard = slot.card;
        const accuracy = this.determineAccuracy(target, subTarget, slotParameters['accuracy'] ?? 0);
        const weaponTraits = this.getWeaponTraits(cardDef, slotCard);

        const gameState = this.getGameState();
        const ship = this.getShip();

        // A shot at a sensor ghost is used up like any other, but passes through, and the ghost vanishes: there's nothing there to hurt, hold or lock onto.
        const ghost = target instanceof SensorGhost ? target : null;
        if (ghost) {
            gameState.broadcastWeaponEffect({
                type: 'shot',
                weapon: cardType,
                sourceId: ship.id,
                targetId: ghost.id,
                targetPosition: ghost.getPosition(currentTime),
                missed: true,
                startTime: currentTime,
            });
            ghost.expose();
        } else {
            cardDef.fire(gameState, ship, target, slotParameters, accuracy, weaponTraits, targetSystem);
        }

        // Anything that only lasted until this shot has done its work.
        slot.endNextShot();
        this.gainSteadyAccuracy(slot);

        // A called shot is used up by the next shot at the ship.
        if (target.id === this.calledShotTargetId) {
            this.removeEffect('calledShot', 'early');
        }

        const extraShots = ghost ? 0 : Math.max(0, Math.floor(slotParameters['extraShots'] ?? 0));

        for (let i = 1; i <= extraShots; i++) {
            gameState.setTimeout(() => {
                cardDef.fire(gameState, ship, target, slotParameters, accuracy, weaponTraits, targetSystem);
            }, i * extraShotDelay);
        }

        if (empties) {
            slot.clear();
        }

        // A weapon with a drain doesn't spend a use's charge: it stays active on its target, draining its charge, until it's ended.
        if (slotCard && !empties && slot.staysActive) {
            slot.activate(target.id, currentTime);
        } else if (slotCard && (empties || slot.afterFiring(currentTime))) {
            this.discardSlotCard(slotCard);
        }

        const selfDamage = slotParameters['selfDamage'];
        if (selfDamage) {
            this.adjustHealth(-selfDamage);
        }

        return cardDef;
    }

    /** A weapon with an `accuracyPerShot` parameter becomes that much more accurate for each shot it fires, up to `maxStackedAccuracy` in all, for as long as it's in its slot. */
    private gainSteadyAccuracy(slot: WeaponSlotState) {
        const perShot = slot.getParameter('accuracyPerShot');
        if (!perShot) {
            return;
        }

        const gain = Math.min(perShot, slot.getParameter('maxStackedAccuracy') - slot.getParameter('steadyAccuracy'));
        if (gain > 0) {
            slot.adjustParameter('accuracy', gain);
            slot.adjustParameter('steadyAccuracy', gain);
        }
    }

    /**
     * The extra damage a weapon with a `damagePerNegativeEffect` parameter does to a ship's system it's aimed at: that much for each negative effect on the system.
     * A shot that isn't aimed gets none, as the system it will land on isn't known until it does.
     */
    private getAimedDamageBonus(slot: WeaponSlotState, target: GameObject, targetSystem: ShipSystem | null): number {
        const damagePerEffect = slot.getParameter('damagePerNegativeEffect');
        if (!damagePerEffect || !targetSystem || !(target instanceof Ship)) {
            return 0;
        }

        const tile = target.engineerState.systems.find(candidate => candidate.system === targetSystem);
        const negativeEffects = tile?.effects.filter(effect => getSystemEffectDefinition(effect.type).category === SystemEffectCategory.Negative) ?? [];
        return negativeEffects.length * damagePerEffect;
    }

    private determineAccuracy(target: GameObject, subTarget: SubTargetInfo | undefined, weaponAccuracy: number) {
        // The way this ship is being flown can steady its weapons, or throw them off.
        let accuracy = 100 + weaponAccuracy + this.getShip().helmState.weaponAccuracyModifier;

        if (target instanceof Ship) {
            // Adjust accuracy based on the target's evasion, if applicable.
            const targetHelm = target.helmState;
            accuracy -= targetHelm.evasion;

            if (subTarget?.system) {
                // Adjust accuracy based on the sub-targeted system, if applicable.
                accuracy += target.getSystem(subTarget.system).chanceToHitPercentageModifier;
            }
        }

        // Every level of Lock held against the target makes each shot at it more accurate.
        if (this.lockLevel > 0 && target.id === this.lockTargetId) {
            accuracy += this.lockLevel * lockAccuracyPerLevel;
        }

        // Clamp accuracy to [0, 100] range.
        accuracy = Math.max(0, Math.min(100, accuracy));
        return accuracy;
    }

    private getWeaponTraits(cardDef: EngineWeaponSlotCardDefinition, card: CardState | null): WeaponTrait[] {
        const traits = new Set<WeaponTrait>();
        if (cardDef.traits) {
            for (const trait of cardDef.traits) {
                if (isWeaponTrait(trait)) {
                    traits.add(trait);
                }
            }
        }

        for (const trait of card?.extraTraits.keys() ?? []) {
            if (isWeaponTrait(trait)) {
                traits.add(trait);
            }
        }

        return Array.from(traits);
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
        this.identifiedSystems.set(targetId, [...systems]);
        this.applySystemSubTargets(targetId);
    }

    /**
     * Stop weapons firing until the `holdingFire` effect ends, when Lock is gained on the ship that is locked now.
     * Returns false if no ship is locked, or weapons are being held already.
     */
    holdFire(): boolean {
        if (this.holdingFire || this.lockLevel <= 0 || !this.lockTargetId) {
            return false;
        }

        this.holdFireTargetId = this.lockTargetId;
        this.addEffect('holdingFire');
        return true;
    }

    /** Called by the `holdingFire` effect as it starts and ends. If it ran its course, the ship that was locked when it began gains Lock, as long as it's still in sight. */
    holdFireChanged(holding: boolean, ranItsCourse = false, lockGain = 0) {
        this.holdingFire = holding;
        if (holding) {
            return;
        }

        const target = ranItsCourse ? this.resolveTarget(this.holdFireTargetId) : null;
        this.holdFireTargetId = '';
        if (target) {
            this.addLock(target, lockGain);
        }
    }

    /**
     * Spend levels of Lock to let every crew system of the locked ship be aimed at, until the `calledShot` effect ends: it's used up by the next shot at that ship, or runs out.
     * Returns false if there isn't that much Lock, or a called shot is set up already.
     */
    callShot(lockCost: number): boolean {
        if (this.hasEffect('calledShot') || this.lockLevel < lockCost || !this.resolveTarget(this.lockTargetId)) {
            return false;
        }

        const targetId = this.lockTargetId;
        this.adjustEffectLevel('lock', -lockCost);
        this.calledShotTargetId = targetId;
        this.addEffect('calledShot');
        this.applySystemSubTargets(targetId);
        return true;
    }

    /** Called by the `calledShot` effect as it ends: only the systems that science has identified can be aimed at again. */
    calledShotEnded() {
        const targetId = this.calledShotTargetId;
        this.calledShotTargetId = '';
        if (targetId) {
            this.applySystemSubTargets(targetId);
        }
    }

    /** Sync the sub-targets of a ship with the systems that can be aimed at: those science has identified, or all the crew systems, while a called shot is set up on it. */
    private applySystemSubTargets(targetId: string): void {
        const systems: ShipSystem[] = this.calledShotTargetId === targetId
            ? [...crewRoleNames]
            : this.identifiedSystems.get(targetId) ?? [];

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

    override adjustCostOfEveryCard(amount: number) {
        super.adjustCostOfEveryCard(amount);

        // Also adjust the cost of cards in the weapon slots.
        for (const slot of this.slots) {
            if (slot.card) {
                slot.card.modifyParameter('cost', amount);
            }
        }
    }

    cleanupAfterEncounter() {
        for (const slot of this.slots) {
            slot.clear();
        }
        super.cleanupAfterEncounter();

        // Clearing the system's effects has already dropped any Lock: this covers a system with none to clear.
        this.lockLevelChanged(0);
        this.holdingFire = false;
        this.holdFireTargetId = '';
        this.calledShotTargetId = '';
    }
}

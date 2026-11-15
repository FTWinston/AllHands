import { cardDefinitions, type CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { getShopCardTypes } from 'common-data/features/cards/utils/getShopCardTypes';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { getCardEvaluator } from 'engine/ai/evaluators';
import { getCardDefinition } from 'engine/cards/getEngineCardDefinition';
import { AiShip } from 'engine/state/AiShip';
import { CardState } from 'engine/state/CardState';
import { MotionKeyframe } from 'engine/state/MotionKeyframe';
import { lockAccuracyPerLevel, lockFadeInterval } from 'engine/state/systems/tactical/TacticalState';
import { setupGameRoom, shipSetup } from 'engine/testUtils';
import { describe, expect, it, vi } from 'vitest';
import { effects as sharedEffects } from './effects/tacticalEffects.shared';
import type { EngineWeaponSlotCardDefinition } from 'engine/cards/EngineCardDefinition';

const rooms = setupGameRoom();

const maxLock = sharedEffects.lock.maxLevel;

/** A ship with two weapon slots and the given tactical hand, and an enemy for it to shoot at: dead ahead and in range, unless placed elsewhere. */
function createFight(tacticalCards: CardType[], enemyX = 5, enemyY = 0) {
    const state = rooms.createState();
    state.initFactions([
        { id: 'player' },
        { id: 'raiders', relations: { player: RelationshipType.Hostile } },
    ], 'player');

    const setup = { ...shipSetup('raiders'), goal: { type: 'search-and-destroy' as const }, skill: 1 };
    setup.tactical = { ...setup.tactical, numSlots: 2, cards: tacticalCards, initialHandSize: tacticalCards.length };
    const ship = new AiShip(state, setup);
    state.add(ship);

    const addEnemy = (x: number, y: number) => {
        const enemy = new AiShip(state, { ...shipSetup('player', x, y), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(enemy);
        ship.updateKnownObjects(0);
        return enemy;
    };
    const enemy = addEnemy(enemyX, enemyY);

    const tactical = ship.tacticalState;
    (tactical as { powerLevel: number }).powerLevel = 5;
    const tile = ship.engineerState.systems.find(candidate => candidate.system === 'tactical')!;

    /** Adds a card to the hand if there's none of its type there, and plays it. Says whether it was played. */
    const play = (cardType: CardType, targetId = '') => {
        let card = tactical.hand.find(candidate => candidate.type === cardType);
        if (!card) {
            card = new CardState(ship.getCardId(), cardType);
            tactical.addCardToHand(card);
        }
        return tactical.playCard(card.id, cardType, cardDefinitions[cardType].targetType, targetId) !== null;
    };

    /** Loads a weapon from the hand into a slot, with the given charge: all it can hold, unless told otherwise. */
    const load = (cardType: CardType, slotIndex: number, charge?: number) => {
        const slot = tactical.slots[slotIndex];
        play(cardType, slot.id);
        slot.addCharge(charge ?? slot.getParameter('totalCharge'), state.currentTime);
        return slot;
    };

    /** Moves the game clock on, and has tactical catch up with it. */
    const wait = (duration: number) => {
        state.currentTime += duration;
        tactical.update(state.currentTime);
    };

    return { state, ship, enemy, addEnemy, tactical, tile, play, load, wait };
}

describe('Lock', () => {
    it('is a levelled effect on tactical, held against the ship that was locked, which tactical\'s own state shows', () => {
        const { enemy, tactical, tile, play, load } = createFight(['phaserCannon']);
        load('phaserCannon', 0);

        expect(play('acquireLock', enemy.id)).toBe(true);
        expect(play('acquireLock', enemy.id)).toBe(true);

        expect(tile.getEffectLevel('lock')).toBe(2);
        expect(tactical.lockLevel).toBe(2);
        expect(tactical.lockTargetId).toBe(enemy.id);
    });

    it('can be gained by dropping the card on one of a ship\'s sub-targets', () => {
        const { enemy, tactical, play } = createFight([]);
        tactical.setSystemSubTargets(enemy.id, ['helm']);

        expect(play('acquireLock', `${enemy.id}:helm`)).toBe(true);
        expect(tactical.lockTargetId).toBe(enemy.id);
    });

    it(`stops at ${maxLock} levels, keeping the card that would have gone over`, () => {
        const { enemy, tactical, play, load } = createFight(['phaserCannon']);
        load('phaserCannon', 0);

        for (let i = 0; i < maxLock; i++) {
            expect(play('acquireLock', enemy.id)).toBe(true);
        }

        expect(play('acquireLock', enemy.id)).toBe(false);
        expect(tactical.lockLevel).toBe(maxLock);
        expect(tactical.hand.some(card => card.type === 'acquireLock')).toBe(true);
    });

    it('can\'t be held against the ship\'s own self', () => {
        const { ship, tactical } = createFight([]);

        expect(tactical.addLock(ship, 1)).toBe(false);
        expect(tactical.lockLevel).toBe(0);
    });

    it('is lost when a different ship is locked', () => {
        const { enemy, addEnemy, tactical, tile, play, load } = createFight(['phaserCannon']);
        load('phaserCannon', 0);
        const other = addEnemy(6, 0);
        play('acquireLock', enemy.id);
        play('acquireLock', enemy.id);

        expect(play('acquireLock', other.id)).toBe(true);

        expect(tactical.lockTargetId).toBe(other.id);
        expect(tactical.lockLevel).toBe(1);
        expect(tile.getEffectLevel('lock')).toBe(1);
    });

    it(`fades a level every ${lockFadeInterval / 1000}s since it was last gained, wherever the locked ship is`, () => {
        expect(cardDefinitions.acquireLock.parameters.fadeSeconds * 1000).toBe(lockFadeInterval);

        // The enemy is dead astern, outside every weapon's arc, which makes no difference.
        const { enemy, tactical, play, load, wait } = createFight(['phaserCannon'], -5, 0);
        load('phaserCannon', 0);
        play('acquireLock', enemy.id);
        play('acquireLock', enemy.id);

        wait(lockFadeInterval - 100);
        expect(tactical.lockLevel).toBe(2);

        wait(100);
        expect(tactical.lockLevel).toBe(1);
        expect(tactical.lockTargetId).toBe(enemy.id);

        wait(lockFadeInterval);
        expect(tactical.lockLevel).toBe(0);
        expect(tactical.lockTargetId).toBe('');
    });

    it('starts its time over whenever more is gained', () => {
        const { enemy, tactical, play, wait } = createFight([]);
        play('acquireLock', enemy.id);
        wait(lockFadeInterval - 100);

        play('acquireLock', enemy.id);
        wait(lockFadeInterval - 1);
        expect(tactical.lockLevel).toBe(2);

        wait(1);
        expect(tactical.lockLevel).toBe(1);
    });

    it('is dropped when the locked ship leaves sensor range', () => {
        const { state, ship, enemy, tactical, tile, play, wait } = createFight([]);
        play('acquireLock', enemy.id);
        play('acquireLock', enemy.id);

        enemy.setMotion(new MotionKeyframe(state.currentTime, 10_000, 0, 0));
        ship.updateKnownObjects(state.currentTime);
        wait(0);

        expect(tactical.lockLevel).toBe(0);
        expect(tactical.lockTargetId).toBe('');
        expect(tile.hasEffect('lock')).toBe(false);
    });

    it('is dropped when the locked ship is destroyed', () => {
        const { enemy, tactical, tile, play, load, wait } = createFight(['phaserCannon']);
        load('phaserCannon', 0);
        play('acquireLock', enemy.id);
        play('acquireLock', enemy.id);

        enemy.destroy();
        wait(0);

        expect(tactical.lockLevel).toBe(0);
        expect(tactical.lockTargetId).toBe('');
        expect(tile.hasEffect('lock')).toBe(false);
    });

    it('is forgotten when the effect is removed some other way, and at the end of an encounter', () => {
        const { enemy, tactical, tile, play } = createFight([]);
        play('acquireLock', enemy.id);

        tile.removeEffect('lock', 'early');
        expect(tactical.lockLevel).toBe(0);
        expect(tactical.lockTargetId).toBe('');

        play('acquireLock', enemy.id);
        tactical.cleanupAfterEncounter();
        expect(tactical.lockLevel).toBe(0);
        expect(tactical.lockTargetId).toBe('');
        expect(tile.hasEffect('lock')).toBe(false);
    });

    it(`adds ${lockAccuracyPerLevel}% accuracy per level to shots at the locked ship, and none to shots at another`, () => {
        expect(cardDefinitions.acquireLock.parameters.accuracyPerLevel).toBe(lockAccuracyPerLevel);

        const { enemy, addEnemy, tactical, play, load } = createFight(['phaserCannon']);
        const other = addEnemy(6, 0);
        const slot = load('phaserCannon', 0);
        slot.adjustParameter('accuracy', -50);
        const fire = vi.spyOn(getCardDefinition('phaserCannon') as EngineWeaponSlotCardDefinition, 'fire').mockReturnValue(true);

        play('acquireLock', enemy.id);
        play('acquireLock', enemy.id);
        tactical.playWeapon(slot, 'phaserCannon', enemy.id);
        tactical.playWeapon(slot, 'phaserCannon', other.id);

        expect(fire.mock.calls.map(call => call[4])).toEqual([50 + 2 * lockAccuracyPerLevel, 50]);
        fire.mockRestore();
    });
});

describe('Alpha Strike', () => {
    it('fires every weapon that can fire at the locked ship, with 5 more damage per level of Lock, using each up and spending the Lock', () => {
        const { enemy, tactical, tile, play, load } = createFight(['phaserCannon', 'phaserStrip']);
        const cannon = load('phaserCannon', 0);
        const strip = load('phaserStrip', 1);
        const damage = vi.spyOn(enemy, 'damage').mockReturnValue(0);
        play('acquireLock', enemy.id);
        play('acquireLock', enemy.id);
        play('acquireLock', enemy.id);

        expect(play('alphaStrike')).toBe(true);

        expect(damage.mock.calls.map(([hit]) => hit.amount)).toEqual([20 + 15, 10 + 15]);
        // The cannon had charge for more shots, but the volley empties it.
        expect(cannon.card).toBeNull();
        expect(cannon.charge).toBe(0);
        expect(strip.card).toBeNull();
        expect(tactical.deck.map(card => card.type)).toEqual(expect.arrayContaining(['phaserCannon', 'phaserStrip']));
        expect(tactical.lockLevel).toBe(0);
        expect(tactical.lockTargetId).toBe('');
        expect(tile.hasEffect('lock')).toBe(false);
    });

    it('leaves alone a weapon that can\'t fire', () => {
        const { enemy, play, load } = createFight(['phaserCannon', 'phaserStrip']);
        load('phaserCannon', 0);
        // Not yet fully charged.
        const strip = load('phaserStrip', 1, 1);
        const damage = vi.spyOn(enemy, 'damage').mockReturnValue(0);
        play('acquireLock', enemy.id);

        expect(play('alphaStrike')).toBe(true);

        expect(damage).toHaveBeenCalledOnce();
        expect(strip.card?.type).toBe('phaserStrip');
        expect(strip.charge).toBe(1);
    });

    it('can\'t be played without Lock', () => {
        const { enemy, tactical, play, load } = createFight(['phaserCannon']);
        const cannon = load('phaserCannon', 0);
        const damage = vi.spyOn(enemy, 'damage').mockReturnValue(0);

        expect(play('alphaStrike')).toBe(false);

        expect(damage).not.toHaveBeenCalled();
        expect(cannon.card).not.toBeNull();
        expect(tactical.hand.some(card => card.type === 'alphaStrike')).toBe(true);
    });

    it('can\'t be played, and keeps its Lock, with no weapon able to fire at the locked ship', () => {
        // The enemy is dead astern.
        const { enemy, tactical, play, load } = createFight(['phaserCannon'], -5, 0);
        load('phaserCannon', 0);
        play('acquireLock', enemy.id);

        expect(play('alphaStrike')).toBe(false);
        expect(tactical.lockLevel).toBe(1);
    });
});

describe('Power Cell', () => {
    it('costs 1, but charges a weapon by 5 when spent as charge', () => {
        const { tactical, play } = createFight(['photonicCannon', 'powerCell']);
        const slot = tactical.slots[0];
        play('photonicCannon', slot.id);
        const cell = tactical.hand.find(card => card.type === 'powerCell')!;
        expect(cell.getParameter('cost')).toBe(1);

        expect(tactical.chargeWeaponSlot(cell.id, slot.id)).toBe(true);

        expect(slot.charge).toBe(5);
        expect(tactical.hand).not.toContain(cell);
    });

    it('gives a weapon 1 charge when played on it, without taking the place of its modifier', () => {
        const { tactical, play } = createFight(['phaserCannon', 'powerCell', 'precisionFocus']);
        const slot = tactical.slots[0];
        play('phaserCannon', slot.id);

        expect(play('powerCell', slot.id)).toBe(true);
        expect(slot.charge).toBe(1);
        expect(slot.modified).toBe(false);
        expect(slot.modifierCard).toBeNull();

        expect(play('precisionFocus', slot.id)).toBe(true);
        expect(slot.modified).toBe(true);

        // It can also be played on a weapon that has a modifier.
        expect(play('powerCell', slot.id)).toBe(true);
        expect(slot.charge).toBe(2);
        expect(slot.modifierCard).toBe('precisionFocus');
    });

    it('can\'t be played on a weapon that can\'t be charged', () => {
        const { tactical, play, load } = createFight(['phaserCannon']);
        const slot = load('phaserCannon', 0);

        expect(play('powerCell', slot.id)).toBe(false);
        expect(tactical.hand.some(card => card.type === 'powerCell')).toBe(true);
    });
});

describe('Hot Swap', () => {
    it('moves all the charge from the other weapon onto the one it\'s played on, without modifying it', () => {
        const { tactical, play, load } = createFight(['phaserCannon', 'photonicCannon']);
        const cannon = load('phaserCannon', 0, 5);
        const photonic = load('photonicCannon', 1, 2);

        expect(play('hotSwap', photonic.id)).toBe(true);

        expect(photonic.charge).toBe(7);
        expect(photonic.modified).toBe(false);
        // The cannon was never fully charged, so it stays loaded, with nothing in it.
        expect(cannon.card?.type).toBe('phaserCannon');
        expect(cannon.charge).toBe(0);
        expect(tactical.hand.some(card => card.type === 'hotSwap')).toBe(false);
    });

    it('uses up a weapon that had been fully charged, when all its charge is moved', () => {
        const { tactical, play, load } = createFight(['phaserStrip', 'photonicCannon']);
        const strip = load('phaserStrip', 0);
        const photonic = load('photonicCannon', 1, 0);

        expect(play('hotSwap', photonic.id)).toBe(true);

        expect(photonic.charge).toBe(6);
        expect(strip.card).toBeNull();
        expect(tactical.deck.at(-2)?.type).toBe('phaserStrip');
    });

    it('moves only what fits, and can top up a weapon that has already been fully charged', () => {
        const { play, load } = createFight(['phaserCannon', 'phaserStrip']);
        const cannon = load('phaserCannon', 0);
        const strip = load('phaserStrip', 1);
        strip.charge = 3;

        expect(play('hotSwap', strip.id)).toBe(true);

        expect(strip.charge).toBe(6);
        expect(cannon.charge).toBe(5);
        expect(cannon.card).not.toBeNull();
    });

    it('can\'t be played with no charge to move, or no room for it', () => {
        const { play, load } = createFight(['phaserCannon', 'phaserStrip']);
        const cannon = load('phaserCannon', 0, 0);
        const strip = load('phaserStrip', 1);

        expect(play('hotSwap', strip.id)).toBe(false);
        expect(strip.charge).toBe(6);

        cannon.charge = 2;
        expect(play('hotSwap', strip.id)).toBe(false);
        expect(cannon.charge).toBe(2);
    });
});

describe('Tractor Beam', () => {
    /** A fight in which the enemy has a helm card to fly, and both ships' effects can be run on. */
    function createTow(enemyX = 5) {
        const fight = createFight([], enemyX, 0);
        const { state, ship, enemy } = fight;
        const shipHelm = ship.engineerState.systems.find(candidate => candidate.system === 'helm')!;
        const enemyHelm = enemy.engineerState.systems.find(candidate => candidate.system === 'helm')!;

        /** Moves the game clock on, and lets both ships' effects run out or tick, and the enemy's helm catch up. */
        const waitEffects = (time: number, step = 250) => {
            for (let elapsed = 0; elapsed < time; elapsed += step) {
                state.currentTime += step;
                ship.engineerState.update(state.currentTime);
                enemy.engineerState.update(state.currentTime);
                enemy.helmState.update(state.currentTime);
            }
        };

        return { ...fight, shipHelm, enemyHelm, waitEffects };
    }

    const { range, targetSlowdown, ownSlowdown, duration } = cardDefinitions.tractorBeam.parameters;

    it(`costs 3, and holds a ship within ${range} for ${duration}s, slowing its manoeuvres by ${targetSlowdown}% and the ship's own by ${ownSlowdown}%`, () => {
        expect(cardDefinitions.tractorBeam.parameters.cost).toBe(3);
        const { ship, enemy, shipHelm, enemyHelm, play, waitEffects } = createTow();

        expect(play('tractorBeam', enemy.id)).toBe(true);

        expect(enemyHelm.getEffectLevel('heldByTractorBeam')).toBe(targetSlowdown);
        expect(shipHelm.getEffectLevel('tractorBeamEngaged')).toBe(ownSlowdown);
        expect(enemy.helmState.maneuverSpeedModifier).toBe(-targetSlowdown);
        expect(ship.helmState.maneuverSpeedModifier).toBe(-ownSlowdown);

        waitEffects(duration * 1000 - 250);
        expect(enemyHelm.hasEffect('heldByTractorBeam')).toBe(true);

        waitEffects(250);
        expect(enemyHelm.hasEffect('heldByTractorBeam')).toBe(false);
        expect(shipHelm.hasEffect('tractorBeamEngaged')).toBe(false);
        expect(enemy.helmState.maneuverSpeedModifier).toBe(0);
        expect(ship.helmState.maneuverSpeedModifier).toBe(0);
    });

    it('cancels the manoeuvre the target is flying when it takes hold', () => {
        const { state, enemy, play, waitEffects } = createTow();
        const helm = enemy.helmState;
        (helm as { powerLevel: number }).powerLevel = 5;
        const card = new CardState(enemy.getCardId(), 'slowAndSteady');
        helm.addCardToHand(card);
        expect(helm.playCard(card.id, card.type, 'location', '5,20')).not.toBeNull();
        helm.update(state.currentTime);
        expect(helm.activeManeuver).not.toBeNull();

        expect(play('tractorBeam', enemy.id)).toBe(true);
        waitEffects(250);

        expect(helm.activeManeuver).toBeNull();
    });

    it('breaks early, for both ships, once the target gets out of range', () => {
        const { state, ship, enemy, shipHelm, enemyHelm, play, waitEffects } = createTow();
        play('tractorBeam', enemy.id);
        waitEffects(1000);

        enemy.setMotion(new MotionKeyframe(state.currentTime, range + 1, 0, 0));
        waitEffects(250);

        expect(enemyHelm.hasEffect('heldByTractorBeam')).toBe(false);
        expect(shipHelm.hasEffect('tractorBeamEngaged')).toBe(false);
        expect(enemy.helmState.maneuverSpeedModifier).toBe(0);
        expect(ship.helmState.maneuverSpeedModifier).toBe(0);
    });

    it('can\'t be played on a ship out of range', () => {
        const { enemy, tactical, enemyHelm, play } = createTow(range + 1);

        expect(play('tractorBeam', enemy.id)).toBe(false);
        expect(enemyHelm.hasEffect('heldByTractorBeam')).toBe(false);
        expect(tactical.hand.some(card => card.type === 'tractorBeam')).toBe(true);
    });

    it('stacks with other effects that slow manoeuvres, leaving them in place when it breaks', () => {
        const { enemy, enemyHelm, play, waitEffects } = createTow();
        enemyHelm.adjustEffectLevel('gravitonDrag', 40);

        play('tractorBeam', enemy.id);
        expect(enemy.helmState.maneuverSpeedModifier).toBe(-40 - targetSlowdown);

        enemyHelm.removeEffect('heldByTractorBeam', 'early');
        expect(enemy.helmState.maneuverSpeedModifier).toBe(-40);
        waitEffects(250);
        expect(enemyHelm.getEffectLevel('gravitonDrag')).toBe(40);
    });

    it('gains Lock on the target, and broadcasts a beam to it once', () => {
        const { state, ship, enemy, tactical, play } = createTow();
        const broadcast = vi.spyOn(state, 'broadcastWeaponEffect');

        play('tractorBeam', enemy.id);

        expect(tactical.lockTargetId).toBe(enemy.id);
        expect(tactical.lockLevel).toBe(1);
        expect(broadcast).toHaveBeenCalledOnce();
        expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({ type: 'shot', weapon: 'tractorBeam', sourceId: ship.id, targetId: enemy.id }));
    });

    it('is released from one ship when beamed onto another', () => {
        const { enemy, addEnemy, enemyHelm, play } = createTow();
        const other = addEnemy(6, 0);
        play('tractorBeam', enemy.id);

        expect(play('tractorBeam', other.id)).toBe(true);

        expect(enemyHelm.hasEffect('heldByTractorBeam')).toBe(false);
        expect(enemy.helmState.maneuverSpeedModifier).toBe(0);
        expect(other.helmState.maneuverSpeedModifier).toBe(-targetSlowdown);
    });
});

describe('Exploit', () => {
    it('adds 6 damage for each negative effect on the system a shot is aimed at, and none to a shot that isn\'t aimed', () => {
        const { enemy, tactical, play, load } = createFight(['phaserCannon']);
        tactical.setSystemSubTargets(enemy.id, ['helm', 'tactical']);
        const slot = load('phaserCannon', 0);
        const damage = vi.spyOn(enemy, 'damage').mockReturnValue(0);
        const enemyHelm = enemy.engineerState.systems.find(tile => tile.system === 'helm')!;
        enemyHelm.addEffect('feedback');
        enemyHelm.addEffect('chronitonSaturation');
        // Not a negative effect, so it doesn't count.
        enemyHelm.addEffect('reducedPower');
        expect(enemyHelm.effects.map(effect => effect.type)).toEqual(['feedback', 'chronitonSaturation', 'reducedPower']);

        expect(play('exploit', slot.id)).toBe(true);
        expect(slot.modified).toBe(true);

        tactical.playWeapon(slot, 'phaserCannon', `${enemy.id}:helm`);
        tactical.playWeapon(slot, 'phaserCannon', `${enemy.id}:tactical`);
        tactical.playWeapon(slot, 'phaserCannon', enemy.id);

        expect(damage.mock.calls.map(([hit]) => hit.amount)).toEqual([20 + 6 * 2, 20, 20]);
    });
});

describe('the new tactical cards', () => {
    it('are all sold in tactical\'s shop', () => {
        expect(getShopCardTypes('tactical')).toEqual(expect.arrayContaining(['acquireLock', 'alphaStrike', 'powerCell', 'hotSwap', 'tractorBeam', 'exploit']));
        expect(getShopCardTypes('tactical')).not.toContain('bleedOff');
    });

    it('lets the AI build Lock on its target, then fire a volley once two weapons are ready', () => {
        const { state, ship, enemy, tactical, play, load } = createFight(['phaserCannon', 'phaserStrip']);
        const ctx = {
            ship,
            gameState: state,
            blackboard: { targetId: enemy.id },
            system: tactical,
            currentTime: state.currentTime,
        } as never;
        const evaluate = (cardType: CardType) => getCardEvaluator(cardType)!(new CardState(ship.getCardId(), cardType), ctx);

        expect(evaluate('alphaStrike')).toEqual([]);
        expect(evaluate('acquireLock')).toEqual([expect.objectContaining({ cost: 1, action: expect.objectContaining({ targetType: 'enemy', targetId: enemy.id }) })]);

        play('acquireLock', enemy.id);
        load('phaserCannon', 0);
        expect(evaluate('alphaStrike')).toEqual([]);

        load('phaserStrip', 1);
        expect(evaluate('alphaStrike')).toEqual([expect.objectContaining({ cost: 3, action: expect.objectContaining({ targetType: 'no-target' }) })]);

        tactical.addLock(enemy, maxLock);
        expect(evaluate('acquireLock')).toEqual([]);
    });
});

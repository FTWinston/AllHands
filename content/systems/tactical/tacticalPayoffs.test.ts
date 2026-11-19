import { cardDefinitions, type CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { cumbersomeAimTime } from 'common-data/features/cards/utils/weaponTraitStats';
import { crewRoleNames } from 'common-data/features/ships/types/CrewRole';
import { FiringState } from 'common-data/features/space/types/FiringState';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { getFiringSolution } from 'common-data/features/space/utils/getFiringSolution';
import { getFiringState } from 'common-data/features/space/utils/getFiringState';
import { getCardEvaluator } from 'engine/ai/evaluators';
import { getCardSynergy } from 'engine/cards/cardSynergies';
import { AiShip } from 'engine/state/AiShip';
import { CardState } from 'engine/state/CardState';
import { MotionKeyframe } from 'engine/state/MotionKeyframe';
import { setupGameRoom, shipSetup } from 'engine/testUtils';
import { describe, expect, it, vi } from 'vitest';
import { holdFireDuration, holdFireLockGain, calledShotDuration } from './effects/tacticalEffects.shared';

const rooms = setupGameRoom();

/** A ship with two weapon slots, and an enemy dead ahead and in range for it to shoot at. */
function createFight() {
    const state = rooms.createState();
    state.initFactions([
        { id: 'player' },
        { id: 'raiders', relations: { player: RelationshipType.Hostile } },
    ], 'player');

    const setup = { ...shipSetup('raiders'), goal: { type: 'search-and-destroy' as const }, skill: 1 };
    setup.tactical = { ...setup.tactical, numSlots: 2 };
    const ship = new AiShip(state, setup);
    state.add(ship);

    const enemy = new AiShip(state, { ...shipSetup('player', 5, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
    state.add(enemy);
    ship.updateKnownObjects(0);

    const tactical = ship.tacticalState;
    (tactical as { powerLevel: number }).powerLevel = 5;

    /** Adds a card of the given type to the hand and plays it. Says whether it was played. */
    const play = (cardType: CardType, targetId = '') => {
        const card = new CardState(ship.getCardId(), cardType);
        tactical.addCardToHand(card);
        const played = tactical.playCard(card.id, cardType, cardDefinitions[cardType].targetType, targetId) !== null;
        if (!played) {
            tactical.removeCard(card.id);
        }
        return played;
    };

    /** Loads a weapon into a slot, with all the charge it can hold. */
    const load = (cardType: CardType, slotIndex: number) => {
        const slot = tactical.slots[slotIndex];
        play(cardType, slot.id);
        slot.addCharge(slot.getParameter('totalCharge'), state.currentTime);
        return slot;
    };

    /** Moves the game clock on, and has tactical catch up with it. */
    const wait = (duration: number) => {
        state.currentTime += duration;
        ship.engineerState.update(state.currentTime);
        tactical.update(state.currentTime);
    };

    /** Tries to fire the weapon in a slot at the enemy, aimed at a system if given. Says whether it fired. */
    const fire = (slotIndex: number, system?: string) => {
        const slot = tactical.slots[slotIndex];
        return tactical.playWeapon(slot, slot.card!.type as never, system ? `${enemy.id}:${system}` : enemy.id) !== null;
    };

    return { state, ship, enemy, tactical, play, load, wait, fire };
}

describe('Siege Lance', () => {
    it('is a rare, cumbersome energy weapon with a heavy hit', () => {
        expect(cardDefinitions.siegeLance).toMatchObject({
            targetType: 'weapon-slot', rarity: 'rare', system: 'tactical', traits: ['energyWeapon', 'cumbersome'], parameters: { cost: 5, damage: 70 },
        });
        expect(getCardSynergy('siegeLance')).toEqual({ provides: ['energyWeapon'], wants: ['lock'] });
        expect(getCardEvaluator('siegeLance')).toBeDefined();
    });

    it('takes energy weapon modifiers', () => {
        const { play, load } = createFight();
        const slot = load('siegeLance', 0);

        expect(play('highIntensity', slot.id)).toBe(true);
    });
});

describe('cumbersome weapons', () => {
    it('can\'t fire until their target has been held in arc and range for 2s', () => {
        const { enemy, tactical, load, wait, fire } = createFight();
        load('siegeLance', 0);
        wait(0);

        expect(fire(0)).toBe(false);
        wait(cumbersomeAimTime - 1);
        expect(fire(0)).toBe(false);

        const slot = tactical.slots[0];
        const solution = getFiringSolution(tactical.getShip().motion, enemy.motion, tactical.getGameState().currentTime);
        expect(getFiringState(solution, true, slot.charge, slot.getParameters(), undefined, tactical.getAimedFor(slot, enemy.id))).toBe(FiringState.Aiming);

        wait(1);
        expect(fire(0)).toBe(true);
    });

    it('syncs when each ship came into position, and forgets it when the ship goes out of range, so that the wait starts over', () => {
        const { state, enemy, tactical, load, wait, fire } = createFight();
        const slot = load('siegeLance', 0);
        const start = state.currentTime;
        wait(1000);
        expect(slot.aimStartTimes.get(enemy.id)).toBe(start + 1000);

        enemy.setMotion(new MotionKeyframe(state.currentTime, 100, 0, 0));
        tactical.getShip().updateKnownObjects(state.currentTime);
        wait(1500);
        expect(slot.aimStartTimes.has(enemy.id)).toBe(false);

        enemy.setMotion(new MotionKeyframe(state.currentTime, 5, 0, 0));
        tactical.getShip().updateKnownObjects(state.currentTime);
        wait(1);
        expect(slot.aimStartTimes.get(enemy.id)).toBe(state.currentTime);

        wait(cumbersomeAimTime - 2);
        expect(fire(0)).toBe(false);
        wait(2);
        expect(fire(0)).toBe(true);
    });

    it('doesn\'t hold back other weapons', () => {
        const { load, wait, fire } = createFight();
        load('phaserCannon', 0);
        wait(0);

        expect(fire(0)).toBe(true);
    });

    it('needn\'t hold aim while the helm is holding the ship steady', () => {
        const { ship, tactical, load, wait, fire } = createFight();
        load('siegeLance', 0);
        wait(0);

        ship.helmState.adjustEffectLevel('holdingSteady', 20);
        wait(0);
        expect(tactical.aimSteadied).toBe(true);
        expect(fire(0)).toBe(true);
    });

    it('keeps an Alpha Strike from firing a weapon that is still aiming', () => {
        const { enemy, tactical, play, load, wait } = createFight();
        load('siegeLance', 0);
        wait(0);
        play('acquireLock', enemy.id);

        expect(tactical.fireVolley(5)).toBe(0);
        expect(tactical.lockLevel).toBe(1);

        wait(cumbersomeAimTime);
        expect(tactical.fireVolley(5)).toBe(1);
    });
});

describe('Hold Fire', () => {
    it('costs 1, and gives no Lock itself', () => {
        expect(cardDefinitions.holdFire).toMatchObject({ targetType: 'no-target', system: 'tactical', parameters: { cost: 1, duration: 6, lockGain: holdFireLockGain } });
        expect(cardDefinitions.holdFire).not.toHaveProperty('rarity');
        expect(getCardSynergy('holdFire')).toEqual({ provides: ['lock'], wants: [] });
    });

    it('is refused with nothing locked', () => {
        const { tactical, play } = createFight();

        expect(play('holdFire')).toBe(false);
        expect(tactical.holdingFire).toBe(false);
    });

    it('stops weapons firing for 6s, then gives 2 Lock on the locked ship', () => {
        const { enemy, tactical, play, load, wait, fire } = createFight();
        load('phaserCannon', 0);
        play('acquireLock', enemy.id);
        expect(play('holdFire')).toBe(true);
        expect(tactical.holdingFire).toBe(true);

        expect(fire(0)).toBe(false);
        expect(tactical.fireVolley(5)).toBe(0);

        wait(holdFireDuration - 1);
        expect(tactical.holdingFire).toBe(true);
        expect(tactical.lockLevel).toBe(1);

        wait(1);
        expect(tactical.holdingFire).toBe(false);
        expect(tactical.lockLevel).toBe(1 + holdFireLockGain);
        expect(tactical.lockTargetId).toBe(enemy.id);
        expect(fire(0)).toBe(true);
    });

    it('can\'t be played again while it lasts', () => {
        const { enemy, play } = createFight();
        play('acquireLock', enemy.id);

        expect(play('holdFire')).toBe(true);
        expect(play('holdFire')).toBe(false);
    });
});

describe('Called Shot', () => {
    it('is uncommon, costs 2 and 3 Lock, and has no AI evaluator', () => {
        expect(cardDefinitions.calledShot).toMatchObject({ targetType: 'no-target', rarity: 'uncommon', system: 'tactical', parameters: { cost: 2, lockCost: 3, duration: 10 } });
        expect(getCardSynergy('calledShot')).toEqual({ provides: [], wants: ['lock'] });
    });

    it('is refused without 3 Lock', () => {
        const { enemy, tactical, play } = createFight();
        play('acquireLock', enemy.id);
        play('acquireLock', enemy.id);

        expect(play('calledShot')).toBe(false);
        expect(tactical.lockLevel).toBe(2);
    });

    it('spends 3 Lock, and makes every crew system of the locked ship something to aim at', () => {
        const { enemy, tactical, play } = createFight();
        for (let i = 0; i < 4; i++) {
            play('acquireLock', enemy.id);
        }

        expect(tactical.subTargetsByTarget.get(enemy.id)).toBeUndefined();
        expect(play('calledShot')).toBe(true);

        expect(tactical.lockLevel).toBe(1);
        expect(tactical.subTargetsByTarget.get(enemy.id)!.subTargets.map(subTarget => subTarget.system).sort()).toEqual([...crewRoleNames].sort());
    });

    it('is used up by the next shot at the ship, which can be aimed at any system', () => {
        const { enemy, tactical, play, load, fire } = createFight();
        load('phaserCannon', 0);
        for (let i = 0; i < 3; i++) {
            play('acquireLock', enemy.id);
        }
        play('calledShot');

        const health = enemy.scienceState.health;
        expect(fire(0, 'science')).toBe(true);
        expect(enemy.scienceState.health).toBeLessThan(health);

        expect(tactical.subTargetsByTarget.get(enemy.id)!.subTargets.length).toBe(0);
        expect(play('calledShot')).toBe(false);
    });

    it('runs out after 10s, leaving the systems that science had identified', () => {
        const { enemy, tactical, play, wait } = createFight();
        tactical.setSystemSubTargets(enemy.id, ['helm']);
        for (let i = 0; i < 3; i++) {
            play('acquireLock', enemy.id);
        }
        play('calledShot');
        expect(tactical.subTargetsByTarget.get(enemy.id)!.subTargets.length).toBe(4);

        wait(calledShotDuration);

        expect(tactical.subTargetsByTarget.get(enemy.id)!.subTargets.map(subTarget => subTarget.system)).toEqual(['helm']);
    });

    it('doesn\'t lose the systems science identifies while it lasts', () => {
        const { enemy, tactical, play } = createFight();
        for (let i = 0; i < 3; i++) {
            play('acquireLock', enemy.id);
        }
        play('calledShot');
        tactical.setSystemSubTargets(enemy.id, ['helm']);

        expect(tactical.subTargetsByTarget.get(enemy.id)!.subTargets.length).toBe(4);
    });
});

describe('Steady Fire', () => {
    it('is an uncommon modifier that wants weapon charge', () => {
        expect(cardDefinitions.steadyFire).toMatchObject({ targetType: 'weapon', rarity: 'uncommon', system: 'tactical', parameters: { cost: 2, accuracyPerShot: 5, maxStackedAccuracy: 20 } });
        expect(getCardSynergy('steadyFire')).toEqual({ provides: [], wants: ['weaponCharge'] });
        expect(getCardEvaluator('steadyFire')).toBeDefined();
    });

    it('makes each shot 5% more accurate than the last, up to 20%, for as long as the weapon stays', () => {
        const { enemy, play, load, fire } = createFight();
        const slot = load('phaserCannon', 0);
        slot.adjustParameter('totalCharge', 20);
        slot.addCharge(20, 0);
        // The enemy would be destroyed by the shots, so they're stopped from landing.
        vi.spyOn(enemy, 'damage').mockReturnValue(0);
        const accuracy = slot.getParameter('accuracy');
        expect(play('steadyFire', slot.id)).toBe(true);
        expect(slot.getParameter('accuracy')).toBe(accuracy);

        const seen: number[] = [];
        for (let i = 0; i < 6; i++) {
            expect(fire(0)).toBe(true);
            seen.push(slot.getParameter('accuracy') - accuracy);
        }

        expect(seen).toEqual([5, 10, 15, 20, 20, 20]);
    });

    it('is lost when the weapon is', () => {
        const { tactical, play, load } = createFight();
        const slot = load('phaserCannon', 0);
        play('steadyFire', slot.id);
        tactical.ejectWeapon(slot.id);

        expect(slot.getParameter('accuracyPerShot')).toBe(0);
        expect(slot.getParameter('steadyAccuracy')).toBe(0);
    });
});

describe('Disabling Shot', () => {
    it('is an uncommon modifier with no AI evaluator', () => {
        expect(cardDefinitions.disablingShot).toMatchObject({ targetType: 'weapon', rarity: 'uncommon', system: 'tactical', parameters: { cost: 2 } });
    });

    it('lets a hit damage the system aimed at without touching the hull', () => {
        const { enemy, tactical, play, load, fire } = createFight();
        tactical.setSystemSubTargets(enemy.id, ['science']);
        const slot = load('phaserCannon', 0);
        play('disablingShot', slot.id);
        const hull = enemy.hullState.health;
        const science = enemy.scienceState.health;

        expect(fire(0, 'science')).toBe(true);

        expect(enemy.hullState.health).toBe(hull);
        expect(enemy.scienceState.health).toBeLessThan(science);
    });

    it('does damage the hull for a shot without it', () => {
        const { enemy, tactical, load, fire } = createFight();
        tactical.setSystemSubTargets(enemy.id, ['science']);
        load('phaserCannon', 0);
        const hull = enemy.hullState.health;

        expect(fire(0, 'science')).toBe(true);

        expect(enemy.hullState.health).toBeLessThan(hull);
    });

    it('never lands an unaimed hit on the hull', () => {
        const { enemy, play, load, fire } = createFight();
        const slot = load('phaserCannon', 0);
        slot.adjustParameter('totalCharge', 20);
        slot.addCharge(20, 0);
        play('disablingShot', slot.id);
        const hull = enemy.hullState.health;

        // Whatever system the game's random picks, the hull is spared.
        for (let i = 0; i < 6; i++) {
            fire(0);
        }

        expect(enemy.hullState.health).toBe(hull);
    });
});

describe('Tracer Round', () => {
    it('costs 1, and has no tags or AI evaluator', () => {
        expect(cardDefinitions.tracerRound).toMatchObject({ targetType: 'weapon', system: 'tactical', parameters: { cost: 1 } });
        expect(cardDefinitions.tracerRound).not.toHaveProperty('rarity');
    });

    it('shows science the system a hit landed on, as a scan would', () => {
        const { ship, enemy, tactical, play, load, fire } = createFight();
        tactical.setSystemSubTargets(enemy.id, ['helm']);
        const slot = load('phaserCannon', 0);
        play('tracerRound', slot.id);
        expect(ship.scienceState.getScannedSystemTarget()).toBeNull();

        expect(fire(0, 'helm')).toBe(true);

        expect(ship.scienceState.getScannedSystemTarget()).toEqual({ ship: enemy, system: 'helm' });
    });

    it('does nothing without the modifier', () => {
        const { ship, enemy, load, fire } = createFight();
        load('phaserCannon', 0);

        fire(0, 'helm');

        expect(ship.scienceState.getScannedSystemTarget()).toBeNull();
        expect(enemy).toBeDefined();
    });

    it('leaves science alone if it\'s scanning something already', () => {
        const { ship, enemy, tactical, play, load, fire } = createFight();
        tactical.setSystemSubTargets(enemy.id, ['helm']);
        ship.scienceState.subscribeToSystem(enemy, 'engineer');
        const slot = load('phaserCannon', 0);
        play('tracerRound', slot.id);

        fire(0, 'helm');

        expect(ship.scienceState.getScannedSystemTarget()).toEqual({ ship: enemy, system: 'engineer' });
    });
});

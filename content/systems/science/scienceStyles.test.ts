import { cardDefinitions, type CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { getShopCardTypes } from 'common-data/features/cards/utils/getShopCardTypes';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { getCardDefinition } from 'engine/cards/getEngineCardDefinition';
import { AiShip } from 'engine/state/AiShip';
import { CardState } from 'engine/state/CardState';
import { MotionKeyframe } from 'engine/state/MotionKeyframe';
import { setupGameRoom, shipSetup } from 'engine/testUtils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cards } from './cards/scienceCards.shared';
import { effects } from './effects/scienceEffects.shared';
import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import type { SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import type { EngineWeaponSlotCardDefinition } from 'engine/cards/EngineCardDefinition';

const rooms = setupGameRoom();

function createWorld() {
    const state = rooms.createState();
    state.initFactions([
        { id: 'player' },
        { id: 'raiders', relations: { player: RelationshipType.Hostile } },
    ], 'player');

    const scannerSetup = { ...shipSetup('player'), goal: { type: 'search-and-destroy' as const }, skill: 1 };
    scannerSetup.science = { ...scannerSetup.science, cards: ['passiveScan', 'passiveScan'], initialHandSize: 0 };
    const scanner = new AiShip(state, scannerSetup);
    state.add(scanner);

    const targetSetup = { ...shipSetup('raiders', 5, 0), goal: { type: 'search-and-destroy' as const }, skill: 1 };
    targetSetup.helm = { ...targetSetup.helm, cards: ['slowAndSteady', 'zigZag', 'strafe', 'fullReverse'], initialHandSize: 2 };
    const target = new AiShip(state, targetSetup);
    state.add(target);

    scanner.updateKnownObjects(0);
    const science = scanner.scienceState;
    science.adjustPowerLevel(5);

    /** Plays a new card of the given type from science's hand, and says whether it was played. */
    const play = (type: CardType, targetType: 'scan' | 'no-target' = 'no-target', targetId = '') => {
        const card = new CardState(scanner.getCardId(), type);
        science.addCardToHand(card);
        const played = science.playCard(card.id, type, targetType, targetId) !== null;
        science.discardCard(card.id);
        return played;
    };

    /** Plays a scan card to reveal one of the target's systems, which science goes on scanning. */
    const reveal = (system: CrewRoleName, type: CardType = 'passiveScan') => play(type, 'scan', `target/${target.id}/${target.getCrewSystem(system).scannedSystemIndex}`);

    const tile = (ship: AiShip, system: CrewRoleName) => ship.engineerState.systems.find(candidate => candidate.system === system)!;

    /** How long an effect on one of the target's systems has left. */
    const timeLeft = (system: CrewRoleName, effect: SystemEffectType) => tile(target, system).effects.find(candidate => candidate.type === effect)!.progress!.endTime - state.currentTime;

    /** Moves the game clock on, and lets both ships' effects run out or tick. Nothing else is updated, so neither ship acts. */
    const wait = (time: number, step = 250) => {
        for (let elapsed = 0; elapsed < time; elapsed += step) {
            state.currentTime += step;
            scanner.engineerState.update(state.currentTime);
            target.engineerState.update(state.currentTime);
        }
    };

    return { state, scanner, target, science, play, reveal, tile, timeLeft, wait };
}

describe('Insight', () => {
    it('is gained by revealing a system, reading a hand and finding a vulnerability, whichever card does it', () => {
        const { science, target, play, reveal } = createWorld();
        expect(science.insight).toBe(0);

        reveal('helm');
        expect(science.insight).toBe(1);

        play('antiprotonScan', 'scan', `hand/${target.id}/helm`);
        expect(science.insight).toBe(2);

        play('chronitonScan', 'scan', `vuln/${target.id}/helm`);
        expect(science.insight).toBe(4);
    });

    it('is gained for each thing a single card does', () => {
        const { science, reveal } = createWorld();

        // A Coherent Beam Scan finds a vulnerability as it reveals a system.
        reveal('helm', 'coherentBeamScan');

        expect(science.insight).toBe(3);
    });

    it('isn\'t gained by a card that can\'t be played', () => {
        const { science, target, play } = createWorld();

        expect(play('passiveScan', 'scan', `hand/${target.id}/helm`)).toBe(false);

        expect(science.insight).toBe(0);
    });

    it('stops at 5, and is kept until it\'s spent', () => {
        const { science, reveal, wait } = createWorld();

        for (let i = 0; i < 7; i++) {
            reveal(i % 2 ? 'helm' : 'tactical');
        }
        expect(science.insight).toBe(5);
        expect(effects.insight.maxLevel).toBe(5);

        wait(600_000, 10_000);
        expect(science.insight).toBe(5);

        expect(science.spendInsight(2)).toBe(true);
        expect(science.insight).toBe(3);
    });

    it('can\'t be spent when there isn\'t enough', () => {
        const { science } = createWorld();
        science.gainInsight(2);

        expect(science.spendInsight(3)).toBe(false);
        expect(science.insight).toBe(2);

        expect(science.spendInsight(2)).toBe(true);
        expect(science.insight).toBe(0);
        expect(science.hasEffect('insight')).toBe(false);
    });

    it('is synced to science\'s own client in step with the effect, as it\'s gained, spent and cleared after an encounter', () => {
        const { science, scanner, reveal, tile } = createWorld();
        const effectLevel = () => tile(scanner, 'science').getEffectLevel('insight');

        reveal('helm', 'coherentBeamScan');
        expect(science.insight).toBe(3);
        expect(effectLevel()).toBe(3);

        science.gainInsight(4);
        expect(science.insight).toBe(5);
        expect(effectLevel()).toBe(5);

        expect(science.spendInsight(4)).toBe(true);
        expect(science.insight).toBe(1);
        expect(effectLevel()).toBe(1);

        science.gainInsight(1);
        science.cleanupAfterEncounter();
        expect(science.hasEffect('insight')).toBe(false);
        expect(science.insight).toBe(0);
    });

    it('can\'t be put on any system but science', () => {
        const { scanner } = createWorld();

        scanner.helmState.adjustEffectLevel('insight', 2);

        expect(scanner.helmState.hasEffect('insight')).toBe(false);
        expect(scanner.scienceState.insight).toBe(0);
    });
});

describe('Deep Scan', () => {
    it('reads the hand of the system it reveals, gaining Insight for both', () => {
        const { science, target, reveal } = createWorld();

        expect(reveal('helm', 'deepScan')).toBe(true);

        expect(science.scannedHelm!.hand!.map(card => card.id)).toEqual(target.helmState.hand.map(card => card.id));
        expect(science.insight).toBe(2);
    });

    it('doesn\'t read a hand when it finds a vulnerability', () => {
        const { science, target, play, reveal } = createWorld();
        reveal('helm');

        expect(play('deepScan', 'scan', `vuln/${target.id}/helm`)).toBe(true);

        expect(science.scannedHelm!.hand).toBeNull();
    });
});

describe('Eureka', () => {
    it('spends 3 Insight to find a vulnerability on the system being scanned, gaining none for it', () => {
        const { science, reveal, play } = createWorld();
        reveal('helm');
        science.gainInsight(3);
        expect(science.insight).toBe(4);

        expect(play('eureka')).toBe(true);

        expect(science.identifiedVulnerability).not.toBeNull();
        expect(science.insight).toBe(1);
        expect(cards.eureka.parameters.insightCost).toBe(3);
    });

    it('can\'t be played without enough Insight', () => {
        const { science, reveal, play } = createWorld();
        reveal('helm');
        science.gainInsight(1);

        expect(play('eureka')).toBe(false);

        expect(science.identifiedVulnerability).toBeNull();
        expect(science.insight).toBe(2);
    });

    it('can\'t be played when no system is being scanned, and keeps its Insight', () => {
        const { science, reveal, play } = createWorld();
        science.gainInsight(5);
        expect(play('eureka')).toBe(false);

        reveal('helm');
        science.closeScan();
        expect(play('eureka')).toBe(false);

        expect(science.insight).toBe(5);
    });
});

describe('Predictive Model', () => {
    it('spends 2 Insight to make the scanned ship\'s shots less accurate for 8 seconds', () => {
        const { science, target, reveal, play, tile, wait } = createWorld();
        reveal('tactical');
        science.gainInsight(2);

        expect(play('predictiveModel')).toBe(true);

        expect(science.insight).toBe(1);
        expect(tile(target, 'helm').getEffectLevel('predictiveModel')).toBe(30);
        expect(target.helmState.weaponAccuracyModifier).toBe(-30);

        wait(7_750);
        expect(target.helmState.weaponAccuracyModifier).toBe(-30);

        wait(250);
        expect(target.helmState.weaponAccuracyModifier).toBe(0);
        expect(target.helmState.hasEffect('predictiveModel')).toBe(false);
    });

    it('starts its time over when played again, without adding up', () => {
        const { science, target, reveal, play, timeLeft, wait } = createWorld();
        reveal('tactical');
        science.gainInsight(4);
        play('predictiveModel');
        wait(5_000);

        expect(play('predictiveModel')).toBe(true);

        expect(target.helmState.weaponAccuracyModifier).toBe(-30);
        expect(timeLeft('helm', 'predictiveModel')).toBe(8_000);
    });

    it('still works on the scanned ship once the scan of its system is closed', () => {
        const { science, target, reveal, play } = createWorld();
        reveal('tactical');
        science.gainInsight(2);
        science.closeScan();

        expect(play('predictiveModel')).toBe(true);
        expect(target.helmState.weaponAccuracyModifier).toBe(-30);
    });

    it('can\'t be played without enough Insight, or with no ship scanned', () => {
        const { science, target, reveal, play } = createWorld();
        science.gainInsight(5);
        expect(play('predictiveModel')).toBe(false);
        expect(science.insight).toBe(5);

        science.spendInsight(5);
        reveal('tactical');
        expect(play('predictiveModel')).toBe(false);
        expect(target.helmState.weaponAccuracyModifier).toBe(0);
    });
});

describe('Graviton Scan', () => {
    it('carries the graviton substance for the deflector', () => {
        expect(getCardDefinition('gravitonScan')).toMatchObject({ targetType: 'scan', deflectorSubstance: 'Graviton' });
    });

    it('slows the manoeuvres of the ship whose system it reveals, whichever system that is, for 10 seconds', () => {
        const { target, reveal, tile, wait } = createWorld();

        expect(reveal('tactical', 'gravitonScan')).toBe(true);

        expect(tile(target, 'helm').getEffectLevel('gravitonDrag')).toBe(40);
        expect(target.helmState.maneuverSpeedModifier).toBe(-40);
        expect(target.helmState.maneuverSpeedMultiplier).toBeCloseTo(0.6);

        wait(9_750);
        expect(target.helmState.maneuverSpeedModifier).toBe(-40);

        wait(250);
        expect(target.helmState.maneuverSpeedModifier).toBe(0);
    });

    it('starts its time over when another reveals a system, without adding up', () => {
        const { target, reveal, timeLeft, wait } = createWorld();
        reveal('tactical', 'gravitonScan');
        wait(6_000);

        reveal('helm', 'gravitonScan');

        expect(target.helmState.maneuverSpeedModifier).toBe(-40);
        expect(timeLeft('helm', 'gravitonDrag')).toBe(10_000);
    });

    it('doesn\'t slow the ship when it finds a vulnerability', () => {
        const { target, play, reveal } = createWorld();
        reveal('helm');

        play('gravitonScan', 'scan', `vuln/${target.id}/helm`);

        expect(target.helmState.maneuverSpeedModifier).toBe(0);
    });
});

describe('Catalyse', () => {
    it('removes every particle effect from the system being scanned, which takes 2 damage for each', () => {
        const { target, reveal, play } = createWorld();
        const helm = target.helmState;
        reveal('helm');
        helm.adjustEffectLevel('tetryonSaturation', 30);
        helm.addEffect('chronitonSaturation');
        // An effect that isn't a particle effect is left alone.
        helm.addEffect('reducedCardCost');
        expect(helm.health).toBe(4);

        expect(play('catalyse')).toBe(true);

        expect(helm.hasEffect('tetryonSaturation')).toBe(false);
        expect(helm.hasEffect('chronitonSaturation')).toBe(false);
        expect(helm.hasEffect('reducedCardCost')).toBe(true);
        expect(helm.health).toBe(0);
        expect(helm.chanceToHitPercentageModifier).toBe(0);
    });

    it('does more damage to a system with Antiproton Residue, which it then removes', () => {
        const { target, reveal, play } = createWorld();
        const helm = target.helmState;
        reveal('helm');
        helm.adjustEffectLevel('antiprotonResidue', 50);

        expect(play('catalyse')).toBe(true);

        // 2 damage for the one effect, half as much again for the residue.
        expect(helm.health).toBe(1);
        expect(helm.hasEffect('antiprotonResidue')).toBe(false);
    });

    it('can\'t be played when the system being scanned has no particle effects, or no system is being scanned', () => {
        const { science, target, reveal, play } = createWorld();
        target.helmState.addEffect('chronitonSaturation');
        expect(play('catalyse')).toBe(false);

        reveal('tactical');
        expect(play('catalyse')).toBe(false);

        reveal('helm');
        science.closeScan();
        expect(play('catalyse')).toBe(false);

        expect(target.helmState.hasEffect('chronitonSaturation')).toBe(true);
        expect(target.helmState.health).toBe(4);
    });
});

describe('Half-life', () => {
    it('stops particle effects on the system being scanned running down for 15 seconds', () => {
        const { target, reveal, play, timeLeft, wait } = createWorld();
        const helm = target.helmState;
        reveal('helm');
        helm.adjustEffectLevel('tetryonSaturation', 30);
        wait(2_000);
        expect(timeLeft('helm', 'tetryonSaturation')).toBe(6_000);

        expect(play('halfLife')).toBe(true);

        wait(14_750);
        expect(timeLeft('helm', 'tetryonSaturation')).toBe(6_000);

        // Once it ends, the effect runs down from where it was.
        wait(250);
        expect(helm.hasEffect('halfLife')).toBe(false);
        expect(timeLeft('helm', 'tetryonSaturation')).toBe(6_000);

        wait(5_750);
        expect(helm.hasEffect('tetryonSaturation')).toBe(true);
        wait(250);
        expect(helm.hasEffect('tetryonSaturation')).toBe(false);
    });

    it('holds a particle effect that arrives while it lasts, from when it arrives', () => {
        const { target, reveal, play, timeLeft, wait } = createWorld();
        reveal('helm');
        play('halfLife');
        wait(5_000);

        target.helmState.adjustEffectLevel('antiprotonResidue', 25);
        wait(5_000);

        expect(timeLeft('helm', 'antiprotonResidue')).toBe(effects.antiprotonResidue.duration);
    });

    it('lets effects that aren\'t particle effects, and those on other systems, run down', () => {
        const { target, reveal, play, timeLeft, wait } = createWorld();
        reveal('helm');
        target.helmState.addEffect('polaronAccumulation');
        target.tacticalState.adjustEffectLevel('tetryonSaturation', 30);

        play('halfLife');
        wait(3_000);

        expect(timeLeft('helm', 'polaronAccumulation')).toBe(effects.polaronAccumulation.duration - 3_000);
        expect(timeLeft('tactical', 'tetryonSaturation')).toBe(effects.tetryonSaturation.duration - 3_000);
    });

    it('can\'t be played when no system is being scanned', () => {
        const { play } = createWorld();

        expect(play('halfLife')).toBe(false);
    });
});

describe('Cross-reaction', () => {
    it('takes all the power from a scanned system with two different particle effects, for 4 seconds', () => {
        const { target, reveal, play, wait } = createWorld();
        const helm = target.helmState;
        helm.adjustPowerLevel(2 - helm.powerLevel);
        reveal('helm');
        helm.adjustEffectLevel('tetryonSaturation', 30);
        helm.addEffect('chronitonSaturation');

        expect(play('crossReaction')).toBe(true);
        expect(helm.powerLevel).toBe(0);

        // The particle effects are left where they are.
        expect(helm.hasEffect('tetryonSaturation')).toBe(true);
        expect(helm.hasEffect('chronitonSaturation')).toBe(true);

        wait(3_750);
        expect(helm.powerLevel).toBe(0);

        wait(250);
        expect(helm.powerLevel).toBe(2);
    });

    it('can\'t be played on a system with fewer than two particle effects, or when no system is being scanned', () => {
        const { science, target, reveal, play } = createWorld();
        const helm = target.helmState;
        const power = helm.powerLevel;
        reveal('helm');
        helm.adjustEffectLevel('tetryonSaturation', 60);
        expect(play('crossReaction')).toBe(false);

        helm.addEffect('chronitonSaturation');
        science.closeScan();
        expect(play('crossReaction')).toBe(false);

        expect(helm.powerLevel).toBe(power);
    });
});

describe('Saturate', () => {
    it('doubles the level of the strongest particle effect on the system being scanned', () => {
        const { target, reveal, play, tile } = createWorld();
        const helm = target.helmState;
        reveal('helm');
        helm.adjustEffectLevel('antiprotonResidue', 25);
        helm.adjustEffectLevel('tetryonSaturation', 30);

        expect(play('saturate')).toBe(true);

        expect(tile(target, 'helm').getEffectLevel('tetryonSaturation')).toBe(60);
        expect(helm.chanceToHitPercentageModifier).toBe(60);
        expect(tile(target, 'helm').getEffectLevel('antiprotonResidue')).toBe(25);
    });

    it('doesn\'t change how long the effect has left', () => {
        const { target, reveal, play, timeLeft, wait } = createWorld();
        reveal('helm');
        target.helmState.adjustEffectLevel('polaronBombardment', 1);
        wait(4_000);

        play('saturate');

        expect(timeLeft('helm', 'polaronBombardment')).toBe(effects.polaronBombardment.duration - 4_000);
    });

    it('can\'t be played when the system being scanned has no particle effect with a level', () => {
        const { target, reveal, play } = createWorld();
        expect(play('saturate')).toBe(false);

        reveal('helm');
        target.helmState.addEffect('chronitonSaturation');
        expect(play('saturate')).toBe(false);
    });
});

describe('the new science cards', () => {
    it.each(['deepScan', 'gravitonScan', 'eureka', 'predictiveModel', 'catalyse', 'halfLife', 'crossReaction', 'saturate'] as const)('can be bought as %s at a shop', (type) => {
        expect(getShopCardTypes('science')).toContain(type);
    });
});

describe('Cross-reference', () => {
    it('gains 1 extra Insight for revealing a system that has been revealed before, and none for one that hasn\'t', () => {
        const { science, reveal } = createWorld();
        expect(cards.crossReference.parameters.extraInsight).toBe(1);

        reveal('helm', 'crossReference');
        expect(science.insight).toBe(1);

        reveal('helm', 'crossReference');
        expect(science.insight).toBe(3);

        reveal('tactical', 'crossReference');
        expect(science.insight).toBe(4);
    });

    it('counts a system that was revealed by any card, and still remembers it after science scans another system', () => {
        const { science, reveal } = createWorld();
        reveal('helm');
        reveal('tactical');
        expect(science.insight).toBe(2);

        reveal('helm', 'crossReference');

        expect(science.insight).toBe(4);
    });

    it('doesn\'t count systems revealed on another ship', () => {
        const { state, scanner, science, reveal, play } = createWorld();
        const other = new AiShip(state, { ...shipSetup('raiders', 6, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(other);
        scanner.updateKnownObjects(0);
        reveal('helm');
        expect(science.insight).toBe(1);

        expect(play('crossReference', 'scan', `target/${other.id}/${other.helmState.scannedSystemIndex}`)).toBe(true);

        expect(science.insight).toBe(2);
    });

    it('is a common scan card that provides Insight, sold at a shop', () => {
        expect(cardDefinitions.crossReference).toMatchObject({ targetType: 'scan', system: 'science', parameters: { cost: 2 } });
        expect('rarity' in cardDefinitions.crossReference).toBe(false);
        expect(getCardDefinition('crossReference').synergy).toEqual({ provides: ['insight'] });
        expect(getShopCardTypes('science')).toContain('crossReference');
    });
});

describe('Firing Solution', () => {
    /** The world, with a phaser cannon in the scanner's tactical, which is made less accurate so that the bonus shows. */
    function createGunnery() {
        const world = createWorld();
        const { state, scanner, target } = world;
        const tactical = scanner.tacticalState;
        (tactical as { powerLevel: number }).powerLevel = 5;

        const slot = tactical.slots[0];
        const weapon = new CardState(scanner.getCardId(), 'phaserCannon');
        tactical.addCardToHand(weapon);
        tactical.playCard(weapon.id, 'phaserCannon', 'weapon-slot', slot.id);
        slot.addCharge(slot.getParameter('totalCharge'), state.currentTime);
        slot.adjustParameter('accuracy', -50);

        const fire = vi.spyOn(getCardDefinition('phaserCannon') as EngineWeaponSlotCardDefinition, 'fire').mockReturnValue(true);
        const shoot = () => tactical.playWeapon(slot, 'phaserCannon', target.id) !== null;
        const shotCards = () => tactical.hand.filter(card => card.type === 'firingSolutionShot');
        /** Plays the card that tactical was given on a weapon, and says whether it was played. */
        const playShot = (slotId = slot.id) => tactical.playCard(shotCards()[0].id, 'firingSolutionShot', 'weapon', slotId) !== null;

        return { ...world, tactical, slot, fire, shoot, shotCards, playShot };
    }

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('spends 2 Insight to give tactical an expendable card that works on a weapon', () => {
        const { science, play, shotCards } = createGunnery();
        science.gainInsight(3);

        expect(play('firingSolution')).toBe(true);

        expect(science.insight).toBe(1);
        expect(shotCards().length).toBe(1);
        expect(cardDefinitions.firingSolution).toMatchObject({ rarity: 'uncommon', parameters: { cost: 1, insightCost: 2 } });
        expect(cardDefinitions.firingSolutionShot).toMatchObject({ targetType: 'weapon', system: 'science', instant: true, traits: ['expendable'], parameters: { cost: 0, accuracyIncrease: 40 } });
    });

    it('can\'t be played without 2 Insight, and gives tactical nothing', () => {
        const { science, play, shotCards } = createGunnery();
        science.gainInsight(1);

        expect(play('firingSolution')).toBe(false);

        expect(science.insight).toBe(1);
        expect(shotCards().length).toBe(0);
    });

    it('makes room in a full tactical hand', () => {
        const { scanner, science, tactical, play, shotCards } = createGunnery();
        science.gainInsight(2);
        while (tactical.hand.length < tactical.maxHandSize) {
            tactical.addCardToHand(new CardState(scanner.getCardId(), 'phaserCannon'));
        }

        expect(play('firingSolution')).toBe(true);

        expect(tactical.hand.length).toBe(tactical.maxHandSize);
        expect(shotCards().length).toBe(1);
    });

    it('makes the weapon\'s next shot 40 points more accurate, and only that shot', () => {
        const { science, slot, fire, shoot, play, playShot, shotCards } = createGunnery();
        science.gainInsight(2);
        play('firingSolution');

        expect(playShot()).toBe(true);
        expect(slot.getParameter('accuracy')).toBe(-10);
        expect(shotCards().length).toBe(0);

        expect(shoot()).toBe(true);
        expect(shoot()).toBe(true);

        expect(fire.mock.calls.map(call => call[4])).toEqual([90, 50]);
        expect(slot.getParameter('accuracy')).toBe(-50);
    });

    it('doesn\'t take the weapon\'s modifier slot, so it can be modified as well', () => {
        const { scanner, science, tactical, slot, play, playShot } = createGunnery();
        science.gainInsight(2);
        play('firingSolution');

        expect(playShot()).toBe(true);

        expect(slot.modified).toBe(false);
        expect(slot.modifierCard).toBeNull();
        const modifier = new CardState(scanner.getCardId(), 'precisionFocus');
        tactical.addCardToHand(modifier);
        expect(tactical.playCard(modifier.id, 'precisionFocus', 'weapon', slot.id)).not.toBeNull();
        expect(slot.modified).toBe(true);
    });

    it('is refused by a slot with no weapon in it, and kept', () => {
        const { science, tactical, play, shotCards, playShot } = createGunnery();
        science.gainInsight(2);
        play('firingSolution');
        tactical.ejectWeapon(tactical.slots[0].id);

        expect(playShot()).toBe(false);

        expect(shotCards().length).toBe(1);
    });

    it('is never sold at a shop, or kept in a deck or hand after an encounter', () => {
        const { scanner, science, tactical, play } = createGunnery();
        for (const role of ['helm', 'science', 'tactical', 'engineer'] as const) {
            expect(getShopCardTypes(role)).not.toContain('firingSolutionShot');
        }
        expect(getShopCardTypes('science')).toContain('firingSolution');

        science.gainInsight(2);
        play('firingSolution');
        scanner.cleanupAfterEncounter();

        expect(tactical.hand.some(card => card.type === 'firingSolutionShot')).toBe(false);
        expect(tactical.deck.some(card => card.type === 'firingSolutionShot')).toBe(false);
    });
});

describe('Plotted Course', () => {
    it('spends 2 Insight, with a ship scanned, to give helm an expendable, high-evasion manoeuvre', () => {
        const { scanner, science, reveal, play } = createWorld();
        reveal('helm');
        science.gainInsight(2);
        expect(science.insight).toBe(3);

        expect(play('plottedCourse')).toBe(true);

        expect(science.insight).toBe(1);
        expect(scanner.helmState.hand.filter(card => card.type === 'plottedCourseManoeuvre').length).toBe(1);
        expect(cardDefinitions.plottedCourseManoeuvre).toMatchObject({ targetType: 'location', system: 'science', traits: ['expendable'], parameters: { cost: 0, evasion: 40 } });
        expect(cardDefinitions.plottedCourse).toMatchObject({ rarity: 'uncommon', parameters: { cost: 1, insightCost: 2 } });
    });

    it('can\'t be played without enough Insight, or without a scanned ship', () => {
        const { scanner, science, reveal, play } = createWorld();
        science.gainInsight(4);
        expect(play('plottedCourse')).toBe(false);
        expect(science.insight).toBe(4);

        reveal('helm');
        science.spendInsight(science.insight - 1);
        expect(play('plottedCourse')).toBe(false);

        expect(scanner.helmState.hand.some(card => card.type === 'plottedCourseManoeuvre')).toBe(false);
    });

    it('is played from helm\'s hand onto a location: the ship sets off, and is harder to hit while it flies', () => {
        const { state, scanner, science, reveal, play } = createWorld();
        reveal('helm');
        science.gainInsight(1);
        play('plottedCourse');
        const helm = scanner.helmState;
        const card = helm.hand.find(candidate => candidate.type === 'plottedCourseManoeuvre')!;

        expect(helm.playCard(card.id, 'plottedCourseManoeuvre', 'location', '0,10')).not.toBeNull();

        expect(helm.evasion).toBe(40);
        expect(helm.activeManeuver!.card).toBe(card);
        const end = scanner.getPosition(state.currentTime + 60_000);
        expect(end.x).toBeCloseTo(0);
        expect(end.y).toBeCloseTo(10);
        // Used up, not put back in the deck.
        expect(helm.hand.some(candidate => candidate.id === card.id)).toBe(false);
        expect(helm.deck.some(candidate => candidate.id === card.id)).toBe(false);
    });

    it('is never sold at a shop, or kept in a deck or hand after an encounter', () => {
        const { scanner, science, reveal, play } = createWorld();
        for (const role of ['helm', 'science', 'tactical', 'engineer'] as const) {
            expect(getShopCardTypes(role)).not.toContain('plottedCourseManoeuvre');
        }
        expect(getShopCardTypes('science')).toContain('plottedCourse');

        reveal('helm');
        science.gainInsight(1);
        play('plottedCourse');
        scanner.cleanupAfterEncounter();

        expect(scanner.helmState.hand.some(card => card.type === 'plottedCourseManoeuvre')).toBe(false);
        expect(scanner.helmState.deck.some(card => card.type === 'plottedCourseManoeuvre')).toBe(false);
    });
});

describe('Active Ping', () => {
    function createPing() {
        const world = createWorld();
        const { state, scanner } = world;
        const addShip = (faction: string, x: number) => {
            const ship = new AiShip(state, { ...shipSetup(faction, x, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
            state.add(ship);
            ship.updateKnownObjects(state.currentTime);
            return ship;
        };
        return { ...world, addShip, ping: () => world.reveal('helm', 'activePing'), scannerKnownTo: (ship: AiShip) => ship.knownObjects.has(scanner.id) };
    }

    it('reveals every crew system of the target at once, for 1 Insight in all', () => {
        const { science, ping } = createPing();

        expect(ping()).toBe(true);

        expect(science.scannedHelm).not.toBeNull();
        expect(science.scannedTactical).not.toBeNull();
        expect(science.scannedScience).not.toBeNull();
        expect(science.scannedEngineer).not.toBeNull();
        expect([...science.scannedSystemOrder].every(system => system !== 0)).toBe(true);
        expect(science.insight).toBe(1);
    });

    it('lets every hostile ship within range know where this ship is, for 10 seconds', () => {
        const { state, addShip, ping, scannerKnownTo } = createPing();
        const near = addShip('raiders', 150);
        const far = addShip('raiders', 400);
        const friend = addShip('player', 150);
        expect([near, far, friend].some(scannerKnownTo)).toBe(false);
        expect(cardDefinitions.activePing.parameters).toMatchObject({ cost: 3, range: 200, duration: 10 });

        ping();

        expect(scannerKnownTo(near)).toBe(true);
        expect(scannerKnownTo(far)).toBe(false);
        expect(scannerKnownTo(friend)).toBe(false);

        state.currentTime += 9_000;
        near.updateKnownObjects(state.currentTime);
        expect(scannerKnownTo(near)).toBe(true);

        state.currentTime += 1_500;
        near.updateKnownObjects(state.currentTime);
        expect(scannerKnownTo(near)).toBe(false);
    });

    it('does nothing, and warns no one, if the scan is refused', () => {
        const { target, science, addShip, ping, scannerKnownTo } = createPing();
        const near = addShip('raiders', 150);
        target.scienceState.addEffect('jammed');

        expect(ping()).toBe(false);

        expect(scannerKnownTo(near)).toBe(false);
        expect(science.scannedHelm).toBeNull();
    });

    it('is an uncommon card', () => {
        expect(cardDefinitions.activePing).toMatchObject({ targetType: 'scan', rarity: 'uncommon' });
        expect(getShopCardTypes('science')).toContain('activePing');
    });
});

describe('Passive Listen', () => {
    it('reveals the system after 3 seconds rather than at once, and gains Insight then', () => {
        const { state, science, reveal } = createWorld();
        const setTimeout = vi.spyOn(state, 'setTimeout');

        expect(reveal('helm', 'passiveListen')).toBe(true);

        expect(science.scannedHelm).toBeNull();
        expect(science.insight).toBe(0);
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 3000);
        expect(cardDefinitions.passiveListen.parameters).toMatchObject({ cost: 1, delay: 3 });

        setTimeout.mock.calls[0][0]();

        expect(science.scannedHelm).not.toBeNull();
        expect(science.insight).toBe(1);
        setTimeout.mockRestore();
    });

    it('reveals nothing if the ship has been destroyed by then', () => {
        const { state, target, science, reveal } = createWorld();
        const setTimeout = vi.spyOn(state, 'setTimeout');
        reveal('helm', 'passiveListen');

        target.destroy();
        setTimeout.mock.calls[0][0]();

        expect(science.scannedHelm).toBeNull();
        setTimeout.mockRestore();
    });

    it('sends nothing out for other ships to notice, unlike Active Ping', () => {
        const { state, scanner, reveal } = createWorld();
        const far = new AiShip(state, { ...shipSetup('raiders', 150, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(far);
        far.updateKnownObjects(state.currentTime);
        const setTimeout = vi.spyOn(state, 'setTimeout');

        reveal('helm', 'passiveListen');
        setTimeout.mock.calls[0][0]();

        expect(far.knownObjects.has(scanner.id)).toBe(false);
        setTimeout.mockRestore();
    });

    it('can be played, and finishes, while science is running quiet', () => {
        const { state, scanner, science, tile, reveal } = createWorld();
        tile(scanner, 'science').addEffect('runningQuiet');
        expect(tile(scanner, 'science').hasEffect('runningQuiet')).toBe(true);
        const setTimeout = vi.spyOn(state, 'setTimeout');

        expect(reveal('helm', 'passiveListen')).toBe(true);
        setTimeout.mock.calls[0][0]();

        expect(science.scannedHelm).not.toBeNull();
        setTimeout.mockRestore();
    });

    it('is a common card that costs 1', () => {
        expect(cardDefinitions.passiveListen).toMatchObject({ targetType: 'scan', parameters: { cost: 1 } });
        expect('rarity' in cardDefinitions.passiveListen).toBe(false);
        expect(getShopCardTypes('science')).toContain('passiveListen');
    });
});

describe('Jam', () => {
    it('makes scans of this ship by other ships fail for 10 seconds, whatever kind they are', () => {
        const { target, science, reveal, play, wait } = createWorld();
        expect(cardDefinitions.jam.parameters).toMatchObject({ cost: 2, duration: 10 });
        target.scienceState.addEffect('jammed');

        expect(reveal('helm')).toBe(false);
        expect(play('passiveScan', 'scan', `hand/${target.id}/helm`)).toBe(false);
        expect(play('passiveScan', 'scan', `vuln/${target.id}/helm`)).toBe(false);
        expect(science.scannedHelm).toBeNull();
        expect(science.insight).toBe(0);

        wait(9_750);
        expect(reveal('helm')).toBe(false);

        wait(500);
        expect(target.scienceState.hasEffect('jammed')).toBe(false);
        expect(reveal('helm')).toBe(true);
        expect(science.insight).toBe(1);
    });

    it('is played with no target, jamming the ship that plays it, and starts over if played again', () => {
        const { state, scanner, play, wait, tile } = createWorld();
        const timeLeft = () => tile(scanner, 'science').effects.find(effect => effect.type === 'jammed')!.progress!.endTime - state.currentTime;

        expect(play('jam')).toBe(true);
        expect(scanner.scienceState.isJamming).toBe(true);
        expect(timeLeft()).toBe(10_000);
        wait(4_000);
        expect(timeLeft()).toBe(6_000);

        expect(play('jam')).toBe(true);

        expect(timeLeft()).toBe(10_000);
    });

    it('doesn\'t stop the jamming ship\'s own scans of others', () => {
        const { science, reveal, play } = createWorld();
        play('jam');

        expect(reveal('helm')).toBe(true);
        expect(science.insight).toBe(1);
    });

    it('is an uncommon card', () => {
        expect(cardDefinitions.jam).toMatchObject({ targetType: 'no-target', rarity: 'uncommon' });
        expect(getShopCardTypes('science')).toContain('jam');
    });
});

describe('Sensor Ghost', () => {
    function createDecoyFight() {
        const state = rooms.createState();
        state.initFactions([
            { id: 'player' },
            { id: 'raiders', relations: { player: RelationshipType.Hostile } },
        ], 'player');
        const player = new AiShip(state, { ...shipSetup('player', 0, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(player);
        const raider = new AiShip(state, { ...shipSetup('raiders', 20, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(raider);
        player.updateKnownObjects(0);
        raider.updateKnownObjects(0);

        (player.scienceState as { powerLevel: number }).powerLevel = 5;
        /** Has a ship's commander reconsider the situation now. */
        const think = (ship: AiShip) => ship.ai.commander.update(ship.ai.blackboard, state.currentTime);
        const playGhost = () => {
            const card = new CardState(player.getCardId(), 'sensorGhost');
            player.scienceState.addCardToHand(card);
            return player.scienceState.playCard(card.id, 'sensorGhost', 'no-target', '') !== null;
        };
        /** Moves the player's ship, as if it had flown off, and lets the raider's commander reconsider. */
        const movePlayer = (x: number) => {
            player.setMotion(new MotionKeyframe(state.currentTime, x, 0, 0));
            player.updateKnownObjects(state.currentTime);
            raider.updateKnownObjects(state.currentTime);
            think(raider);
        };
        return { state, player, raider, think, playGhost, movePlayer };
    }

    it('leaves a false contact where the ship is, for 15 seconds', () => {
        const { state, player, playGhost } = createDecoyFight();
        player.setMotion(new MotionKeyframe(state.currentTime, 7, 3, 0));
        expect(cardDefinitions.sensorGhost.parameters).toMatchObject({ cost: 2, duration: 15 });

        expect(playGhost()).toBe(true);

        expect(state.getDecoys()).toEqual([{ ownerId: player.id, position: { x: 7, y: 3 }, endTime: state.currentTime + 15_000 }]);

        state.currentTime += 14_000;
        expect(state.getDecoys().length).toBe(1);
        state.currentTime += 1_500;
        expect(state.getDecoys().length).toBe(0);
    });

    it('sends a hostile AI ship to the contact, rather than after the ship, once the ship has flown further from it than the contact is', () => {
        const { player, raider, think, playGhost, movePlayer } = createDecoyFight();
        think(raider);
        expect(raider.ai.blackboard.targetId).toBe(player.id);

        playGhost();
        movePlayer(-60);

        expect(raider.ai.blackboard.targetId).toBeNull();
        expect(raider.ai.blackboard.lastKnownTargetPosition).toEqual({ x: 0, y: 0 });
        expect(raider.ai.blackboard.destination).toEqual({ x: 0, y: 0 });
    });

    it('isn\'t fooled while the ship is nearer than the contact, or once the contact has run out', () => {
        const { state, player, raider, playGhost, movePlayer } = createDecoyFight();
        playGhost();

        // The raider is as near the ship as it is the contact.
        movePlayer(0);
        expect(raider.ai.blackboard.targetId).toBe(player.id);

        // Nearer the ship than the contact.
        raider.setMotion(new MotionKeyframe(state.currentTime, -30, 0, 0));
        movePlayer(-20);
        expect(raider.ai.blackboard.targetId).toBe(player.id);

        raider.setMotion(new MotionKeyframe(state.currentTime, 20, 0, 0));
        movePlayer(-60);
        expect(raider.ai.blackboard.targetId).toBeNull();

        state.currentTime += 16_000;
        movePlayer(-60);
        expect(raider.ai.blackboard.targetId).toBe(player.id);
    });

    it('doesn\'t fool a ship of the same faction', () => {
        const { state, think, playGhost, movePlayer } = createDecoyFight();
        const friend = new AiShip(state, { ...shipSetup('player', 20, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(friend);
        playGhost();
        movePlayer(-60);

        friend.updateKnownObjects(state.currentTime);
        think(friend);

        expect(friend.ai.blackboard.lastKnownTargetPosition).not.toEqual({ x: 0, y: 0 });
    });

    it('is an uncommon card', () => {
        expect(cardDefinitions.sensorGhost).toMatchObject({ targetType: 'no-target', rarity: 'uncommon' });
        expect(getShopCardTypes('science')).toContain('sensorGhost');
    });
});

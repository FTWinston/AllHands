import { getShopCardTypes } from 'common-data/features/cards/utils/getShopCardTypes';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { getCardDefinition } from 'engine/cards/getEngineCardDefinition';
import { AiShip } from 'engine/state/AiShip';
import { CardState } from 'engine/state/CardState';
import { setupGameRoom, shipSetup } from 'engine/testUtils';
import { describe, expect, it } from 'vitest';
import { cards } from './cards/scienceCards.shared';
import { effects } from './effects/scienceEffects.shared';
import type { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import type { SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';

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

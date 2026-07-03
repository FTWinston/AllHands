import { ClockTimer } from '@colyseus/timer';
import { IRandom } from 'common-data/types/IRandom';
import { AiShip } from 'src/state/AiShip';
import { GameState } from 'src/state/GameState';
import { shipSetup } from 'src/testUtils';
import { IdProvider } from 'src/types/IdProvider';
import { describe, it, expect } from 'vitest';
import { registerCardEvaluator } from '../evaluators';
import { CandidatePlay, createBlackboard, resolveAiConfig } from '../types';
import { Officer, PLAY_THRESHOLD } from './Officer';

/** Deterministic IRandom: never skips, no noise, stable picks. */
function fixedRandom(booleanResult = false): IRandom {
    return {
        getFloat: () => 0,
        getBoolean: () => booleanResult,
        getInt: () => 0,
        pick: values => values[0],
        insert: (array, value) => {
            (array as unknown as unknown[]).push(value);
        },
        delete: values => (values as unknown as unknown[]).pop() as never,
        shuffle: () => {},
    };
}

class TestOfficer extends Officer {
    readonly role = 'science' as const;
    executed: string[] = [];
    protected execute(action: never): void {
        this.executed.push(JSON.stringify(action));
        super.execute(action);
    }
}

function createWorld(random: IRandom, skill = 1) {
    let nextId = 1;
    const idPool: IdProvider = { getId: () => String(nextId++), releaseId: () => {} };
    const state = new GameState(idPool, new ClockTimer(false), 1, random);
    state.initFactions([{ id: 'raiders' }], 'raiders');
    const setup = { ...shipSetup('raiders'), goal: { type: 'search-and-destroy' as const }, skill };
    // exampleNoTarget costs 2; science initial power 3.
    setup.science = { ...setup.science, cards: ['exampleNoTarget', 'exampleNoTarget'], initialHandSize: 2 };
    const ship = new AiShip(state, setup);
    state.add(ship);
    const officer = new TestOfficer(ship, state, resolveAiConfig(setup as never));
    const bb = createBlackboard(setup.goal);
    return { state, ship, officer, bb };
}

/** Register an evaluator for exampleNoTarget that emits one candidate per card with the given score/cost. */
function stubEvaluator(score: number, cost = 2) {
    registerCardEvaluator('exampleNoTarget', (card): CandidatePlay[] => [{
        score,
        cost,
        action: { kind: 'playCard', cardId: card.id, cardType: 'exampleNoTarget', targetType: 'no-target', targetId: '' },
    }]);
}

describe('Officer.think', () => {
    it('plays the top candidate when it clears the threshold', () => {
        const { ship, officer, bb } = createWorld(fixedRandom());
        stubEvaluator(50);
        const handBefore = ship.scienceState.hand.length;
        officer.think(bb, 0);
        expect(officer.executed).toHaveLength(1);
        expect(ship.scienceState.hand.length).toBe(handBefore - 1); // card was really played and discarded
    });

    it('plays nothing below the threshold (waiting wins)', () => {
        const { officer, bb } = createWorld(fixedRandom());
        stubEvaluator(PLAY_THRESHOLD - 1);
        officer.think(bb, 0);
        expect(officer.executed).toHaveLength(0);
    });

    it('makes at most one play per think', () => {
        const { officer, bb } = createWorld(fixedRandom());
        stubEvaluator(90);
        officer.think(bb, 0);
        expect(officer.executed).toHaveLength(1);
    });

    it('posts a power request instead of playing an unaffordable candidate', () => {
        const { officer, bb } = createWorld(fixedRandom());
        stubEvaluator(90, 5); // science power is 3
        officer.think(bb, 0);
        expect(officer.executed).toHaveLength(0);
        expect(bb.powerRequests.get('science')).toEqual({ desiredLevel: 5, expires: 5000 });
    });

    it('refreshes the power request expiry on every think while the need persists', () => {
        const { officer, bb } = createWorld(fixedRandom());
        stubEvaluator(90, 5); // science power is 3
        officer.think(bb, 0);
        expect(bb.powerRequests.get('science')).toEqual({ desiredLevel: 5, expires: 5000 });

        officer.think(bb, 1000);
        expect(officer.executed).toHaveLength(0);
        expect(bb.powerRequests.get('science')).toEqual({ desiredLevel: 5, expires: 6000 });
    });

    it('skips the whole think at low skill when the dice say so', () => {
        const { officer, bb } = createWorld(fixedRandom(true), 0); // getBoolean always true → skip fires
        stubEvaluator(90);
        officer.think(bb, 0);
        expect(officer.executed).toHaveLength(0);
    });

    it('applies the switching cost to interrupting candidates', () => {
        const { officer, bb } = createWorld(fixedRandom());
        registerCardEvaluator('exampleNoTarget', (card): CandidatePlay[] => [{
            score: PLAY_THRESHOLD + 10, // 30 - SWITCHING_COST(15) = 15 < threshold → held
            cost: 0,
            interrupts: true,
            action: { kind: 'playCard', cardId: card.id, cardType: 'exampleNoTarget', targetType: 'no-target', targetId: '' },
        }]);
        officer.think(bb, 0);
        expect(officer.executed).toHaveLength(0);
    });
});

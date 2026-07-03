import { ClockTimer } from '@colyseus/timer';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { IRandom } from 'common-data/types/IRandom';
import { AiShip } from 'src/state/AiShip';
import { GameState } from 'src/state/GameState';
import { PlayerShip } from 'src/state/PlayerShip';
import { shipSetup } from 'src/testUtils';
import { IdProvider } from 'src/types/IdProvider';
import { describe, it, expect } from 'vitest';

const FIVE_MINUTES = 5 * 60 * 1000;
const TICK = 100;

/** IRandom that makes every officer skip (getBoolean true also means weapon hits land, but none fire). */
function alwaysSkipRandom(): IRandom {
    return {
        getFloat: () => 0, getBoolean: () => true, getInt: () => 0,
        pick: values => values[0],
        insert: (array, value) => {
            (array as unknown as unknown[]).push(value);
        },
        delete: values => (values as unknown as unknown[]).pop() as never,
        shuffle: () => {},
    };
}

function createBattle(skill: number, hostile = true, random?: IRandom) {
    let nextId = 1;
    const idPool: IdProvider = { getId: () => String(nextId++), releaseId: () => {} };
    const state = new GameState(idPool, new ClockTimer(false), 1, random);
    state.initFactions([
        { id: 'player' },
        { id: 'raiders', relations: hostile ? { player: RelationshipType.Hostile } : { player: RelationshipType.Friendly } },
    ], 'player');

    // Defenceless dummy: a PlayerShip with no crew never acts.
    const { appearance: _a, faction: _f, ...playerSetup } = shipSetup(undefined, 0, 0);
    const dummy = new PlayerShip(state, playerSetup);
    state.add(dummy);

    const attacker = new AiShip(state, {
        ...shipSetup('raiders', 12, 0),
        goal: { type: 'search-and-destroy' },
        skill,
        helm: { ...shipSetup('raiders').helm, cards: ['slowAndSteady', 'zigZag', 'strafe', 'slowAndSteady'] as never, initialHandSize: 2 },
        science: { ...shipSetup('raiders').science, cards: ['scan', 'scan', 'scan'] as never, initialHandSize: 2 },
        tactical: { ...shipSetup('raiders').tactical, numSlots: 1, cards: ['phaserCannon', 'quickCharge', 'heavyCharge'] as never, initialHandSize: 3 },
        engineer: { ...shipSetup('raiders').engineer, cards: ['auxPower', 'auxPower'] as never, initialHandSize: 2 },
    });
    state.add(attacker);
    return { state, dummy, attacker };
}

function totalHealth(ship: PlayerShip): number {
    return ship.hullState.health
        + ship.helmState.health + ship.scienceState.health
        + ship.tacticalState.health + ship.engineerState.health
        + ship.reactorState.health;
}

function run(state: GameState, ms: number, until?: () => boolean) {
    for (let t = 0; t < ms; t += TICK) {
        state.tick(TICK);
        if (until?.()) {
            return;
        }
    }
}

describe('AI ship integration', () => {
    it('a skill-1 hostile closes and damages a defenceless target within 5 minutes', () => {
        const { state, dummy } = createBattle(1);
        const before = totalHealth(dummy);
        run(state, FIVE_MINUTES, () => totalHealth(dummy) < before);
        // Assertion set A (charge functions real): damage landed.
        expect(totalHealth(dummy)).toBeLessThan(before);
        // Assertion set B (charge functions stubbed): replace the line above with:
        // expect(attacker.tacticalState.slots[0].primed).toBe(true);
    });

    it('an AI that always skips its thinks never acts', () => {
        const { state, dummy, attacker } = createBattle(0, true, alwaysSkipRandom());
        const before = totalHealth(dummy);
        run(state, 60_000);
        expect(totalHealth(dummy)).toBe(before);
        expect(attacker.tacticalState.slots[0].card).toBeNull();
    });

    it('a friendly ship never attacks, until relations turn hostile at runtime', () => {
        const { state, dummy } = createBattle(1, false);
        const before = totalHealth(dummy);
        run(state, 60_000);
        expect(totalHealth(dummy)).toBe(before);

        state.factionRegistry.setRelationship('raiders', 'player', RelationshipType.Hostile);
        run(state, FIVE_MINUTES, () => totalHealth(dummy) < before);
        expect(totalHealth(dummy)).toBeLessThan(before);
        // (Same set-B substitution applies if charging is stubbed.)
    });
});

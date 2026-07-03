import { ClockTimer } from '@colyseus/timer';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { AiShip } from 'src/state/AiShip';
import { GameState } from 'src/state/GameState';
import { shipSetup } from 'src/testUtils';
import { IdProvider } from 'src/types/IdProvider';
import { describe, it, expect } from 'vitest';

function createWorld() {
    let nextId = 1;
    const idPool: IdProvider = { getId: () => String(nextId++), releaseId: () => {} };
    const state = new GameState(idPool, new ClockTimer(false));
    state.initFactions([
        { id: 'player' },
        { id: 'raiders', relations: { player: RelationshipType.Hostile } },
    ], 'player');
    const setup = { ...shipSetup('raiders'), goal: { type: 'search-and-destroy' as const }, skill: 1 };
    setup.science = { ...setup.science, cards: ['scan', 'scan'] as never, initialHandSize: 2 };
    const scanner = new AiShip(state, setup);
    state.add(scanner);
    const target = new AiShip(state, { ...shipSetup('player', 5, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
    state.add(target);
    scanner.updateKnownObjects(0);
    return { state, scanner, target };
}

describe('ScienceState scan-slot targeting', () => {
    it('plays a scan onto a specific scan slot of a target ship', () => {
        const { scanner, target } = createWorld();
        const card = scanner.scienceState.hand[0];

        const played = scanner.scienceState.playCard(card.id, 'scan', 'enemy', `${target.id}:0`);

        expect(played).not.toBeNull();
        expect(scanner.scienceState.scannedShipId).toBe(target.id);
        // Slot 0 now identifies whichever system the target randomised into it.
        const order = scanner.scienceState.systemOrderByTarget.get(target.id)!;
        expect(order.order[0]).toBeGreaterThan(0);
        // Tactical learned the identified system as a sub-target.
        expect(scanner.tacticalState.subTargetsByTarget.get(target.id)?.subTargets.length).toBe(1);
    });

    it('rejects an invalid slot index, leaving the card in hand', () => {
        const { scanner, target } = createWorld();
        const card = scanner.scienceState.hand[0];
        const handBefore = scanner.scienceState.hand.length;

        const played = scanner.scienceState.playCard(card.id, 'scan', 'enemy', `${target.id}:9`);

        expect(played).toBeNull();
        expect(scanner.scienceState.hand.length).toBe(handBefore);
    });

    it('rejects a nonexistent target ship, leaving the card in hand', () => {
        const { scanner } = createWorld();
        const card = scanner.scienceState.hand[0];
        const handBefore = scanner.scienceState.hand.length;

        const played = scanner.scienceState.playCard(card.id, 'scan', 'enemy', 'no-such-object:0');

        expect(played).toBeNull();
        expect(scanner.scienceState.hand.length).toBe(handBefore);
    });
});

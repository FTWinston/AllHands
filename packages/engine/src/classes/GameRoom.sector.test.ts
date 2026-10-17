import { ownEngineerClientRole, ownHelmClientRole, ownScienceClientRole, ownTacticalClientRole } from 'common-data/features/ships/types/CrewRole';
import { DEV_TOOLS_ENABLED } from 'src/generated/devtools';
import { setupGameRoom } from 'src/testUtils';
import { getHostileShips } from 'src/utils/shipQueries';
import { describe, expect, it } from 'vitest';
import type { GameRoom } from './GameRoom';
import type { ColyseusTestServer } from '@colyseus/testing';

const rooms = setupGameRoom();

type TestClient = Awaited<ReturnType<ColyseusTestServer['connectTo']>>;
type RoleName = 'helm' | 'tactical' | 'science' | 'engineer';

const roleIds: Record<RoleName, number> = {
    helm: ownHelmClientRole,
    tactical: ownTacticalClientRole,
    science: ownScienceClientRole,
    engineer: ownEngineerClientRole,
};

function connect(room: GameRoom, options: object): Promise<TestClient> {
    // The test server's typings only accept a plain Room, not a Room with a typed state.
    return rooms.getServer().connectTo(room as unknown as Parameters<ColyseusTestServer['connectTo']>[0], options);
}

async function send(room: GameRoom, client: TestClient, type: string, payload?: unknown) {
    const delivered = room.waitForNextMessage();
    client.send(type, payload);
    await delivered;
    // Let the server-side handler finish before the test inspects state.
    await new Promise(resolve => setTimeout(resolve, 10));
}

/** A ship client plus one crew client per role, all ready, so the campaign has started. */
async function startGame() {
    const room = rooms.getRoom();

    const shipClient = await connect(room, { type: 'ship' });
    const [crewId] = [...room.state.crews.keys()];

    const roles: RoleName[] = ['helm', 'tactical', 'science', 'engineer'];
    const clients = {} as Record<RoleName, TestClient>;
    for (const role of roles) {
        clients[role] = await connect(room, { type: 'crew', crewId });
        await send(room, clients[role], 'role', roleIds[role]);
    }

    for (const role of roles) {
        await send(room, clients[role], 'ready', true);
    }

    expect(room.state.gameStatus).toBe('active');
    const ship = room.state.crews.get(crewId)!.ship!;

    return { room, state: room.state, ship, shipClient, clients };
}

describe('GameRoom campaign messages', () => {
    it('starts the campaign in the sector intro once the crew is ready', async () => {
        const { state } = await startGame();

        expect(state.phase).toBe('sectorIntro');
        expect(state.message?.kind).toBe('intro');
    });

    it('only tactical can dismiss a sector message', async () => {
        const { room, state, clients } = await startGame();

        for (const role of ['helm', 'science', 'engineer'] as const) {
            await send(room, clients[role], 'dismissMessage');
            expect(state.phase).toBe('sectorIntro');
        }

        await send(room, clients.tactical, 'dismissMessage');
        expect(state.phase).toBe('map');

        // Outside an intro or outro, even tactical is ignored.
        await send(room, clients.tactical, 'dismissMessage');
        expect(state.phase).toBe('map');
    });

    it('only helm can play a route card, and only on the map', async () => {
        const { room, state, ship, clients } = await startGame();
        const playRoute = (role: RoleName, cardId: number) => send(room, clients[role], 'playNonEncounterCard', { cardId });

        await send(room, clients.tactical, 'dismissMessage');
        const target = ship.helmState.nonEncounterCards[0];
        const targetNodeId = target.route!.nodeId;

        await playRoute('science', ship.scienceState.nonEncounterCards[0].id);
        expect(state.phase).toBe('map');
        // Engineer has no such cards, so even helm's card id means nothing to them.
        await playRoute('engineer', target.id);
        expect(state.phase).toBe('map');

        await playRoute('helm', -1);
        expect(state.phase).toBe('map');

        await playRoute('helm', target.id);
        expect(state.phase).toBe('encounter');
        expect(state.map!.currentNodeId).toBe(targetNodeId);
    });

    it('helm can play Warp Away only once the card exists', async () => {
        const { room, state, ship, clients } = await startGame();
        await send(room, clients.tactical, 'dismissMessage');
        await send(room, clients.helm, 'playNonEncounterCard', { cardId: ship.helmState.nonEncounterCards[0].id });
        expect(state.phase).toBe('encounter');

        // The card has not been offered, so a guessed id does nothing.
        await send(room, clients.helm, 'playCard', { cardId: 9999, cardType: 'warpAway', targetType: 'no-target', targetId: '' });
        expect(state.phase).toBe('encounter');

        for (const hostile of getHostileShips(state)) {
            hostile.destroy();
        }
        // Survive and boss objectives are not met by clearing hostiles, so finish those directly.
        if (!state.encounter!.objectiveMet) {
            state.currentTime += state.campaign!.activeEncounter!.objectiveEndTime;
            state.campaign!.tick(0);
        }

        const warpCard = ship.helmState.hand.find(card => card.type === 'warpAway')!;
        expect(warpCard).toBeDefined();

        await send(room, clients.helm, 'playCard', { cardId: warpCard.id, cardType: 'warpAway', targetType: 'no-target', targetId: '' });
        expect(state.phase).toBe('map');
        expect(ship.helmState.hand.some(card => card.type === 'warpAway')).toBe(false);
    });

    it('does not let science preview cards be played', async () => {
        const { room, state, ship, clients } = await startGame();
        await send(room, clients.tactical, 'dismissMessage');

        const [preview] = ship.scienceState.nonEncounterCards;
        await send(room, clients.science, 'playNonEncounterCard', { cardId: preview.id });

        expect(state.phase).toBe('map');
        expect(ship.scienceState.nonEncounterCards).toHaveLength(state.map!.availableNodeIds.length);
    });
    if (DEV_TOOLS_ENABLED) {
        it('dev client can start any encounter from the lobby', async () => {
            const room = rooms.getRoom();
            const shipClient = await connect(room, { type: 'ship' });

            expect(room.state.gameStatus).toBe('setup');
            await send(room, shipClient, 'devLoadEncounter', { encounterId: 'assault' });

            expect(room.state.gameStatus).toBe('active');
            expect(room.state.phase).toBe('encounter');
            expect(room.state.encounter?.encounterId).toBe('assault');

            await send(room, shipClient, 'devLoadEncounter', { encounterId: 'bogus' });
            expect(room.state.encounter?.encounterId).toBe('assault');
        });
    } else {
        it('dev client cannot start encounters from the lobby', async () => {
            const room = rooms.getRoom();
            const shipClient = await connect(room, { type: 'ship' });

            expect(room.state.gameStatus).toBe('setup');
            await send(room, shipClient, 'devLoadEncounter', { encounterId: 'assault' });

            expect(room.state.gameStatus).toBe('setup');
            expect(room.state.phase).toBeNull();
            expect(room.state.encounter?.encounterId).toBeUndefined();
        });
    }
});

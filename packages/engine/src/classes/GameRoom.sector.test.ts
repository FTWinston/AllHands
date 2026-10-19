import { ownEngineerClientRole, ownHelmClientRole, ownScienceClientRole, ownTacticalClientRole } from 'common-data/features/ships/types/CrewRole';
import { DEV_TOOLS_ENABLED } from 'src/generated/devtools';
import { setupGameRoom } from 'src/testUtils';
import { getHostileShips } from 'src/utils/shipQueries';
import { describe, expect, it } from 'vitest';
import { startCountdownDuration, type GameRoom } from './GameRoom';
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

const roles: RoleName[] = ['helm', 'tactical', 'science', 'engineer'];

/** A ship client plus one crew client per role, with every role claimed, so the start countdown is running. */
async function claimAllRoles() {
    const room = rooms.getRoom();

    const shipClient = await connect(room, { type: 'ship' });
    const [crewId] = [...room.state.crews.keys()];

    const clients = {} as Record<RoleName, TestClient>;
    for (const role of roles) {
        clients[role] = await connect(room, { type: 'crew', crewId });
        await send(room, clients[role], 'role', roleIds[role]);
    }

    return { room, crewId, shipClient, clients };
}

/** A ship client plus one crew client per role, so the campaign has started. */
async function startGame() {
    const { room, crewId, shipClient, clients } = await claimAllRoles();

    room.tickStartCountdown(startCountdownDuration);

    expect(room.state.gameStatus).toBe('active');
    const ship = room.state.crews.get(crewId)!.ship!;

    return { room, state: room.state, ship, shipClient, clients };
}

describe('GameRoom start countdown', () => {
    it('counts down once every role is claimed, rather than starting straight away', async () => {
        const { room } = await claimAllRoles();

        expect(room.state.gameStatus).toBe('setup');
        expect(room.state.startCountdown).toBe(5);

        room.tickStartCountdown(1500);
        expect(room.state.startCountdown).toBe(4);
        expect(room.state.gameStatus).toBe('setup');

        room.tickStartCountdown(startCountdownDuration - 1500);
        expect(room.state.gameStatus).toBe('active');
        expect(room.state.startCountdown).toBe(0);
    });

    it('cancels the countdown when a role is released', async () => {
        const { room, clients } = await claimAllRoles();

        room.tickStartCountdown(3000);
        await send(room, clients.science, 'role', '');

        expect(room.state.startCountdown).toBe(0);
        room.tickStartCountdown(startCountdownDuration);
        expect(room.state.gameStatus).toBe('setup');

        // Claiming it again restarts the countdown from the beginning.
        await send(room, clients.science, 'role', roleIds.science);
        expect(room.state.startCountdown).toBe(5);
    });

    it('cancels the countdown when a crew member leaves', async () => {
        const { room, clients } = await claimAllRoles();

        await clients.helm.leave();
        // Let the server-side leave handler run before the test inspects state.
        await new Promise(resolve => setTimeout(resolve, 50));

        expect(room.state.startCountdown).toBe(0);
        room.tickStartCountdown(startCountdownDuration);
        expect(room.state.gameStatus).toBe('setup');
    });
});

describe('GameRoom campaign messages', () => {
    it('starts the campaign in the sector intro once every role is claimed', async () => {
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

        // Other crew have no such cards, so even helm's card id means nothing to them.
        await playRoute('science', target.id);
        expect(state.phase).toBe('map');
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

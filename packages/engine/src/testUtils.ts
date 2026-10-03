import { boot, type ColyseusTestServer } from '@colyseus/testing';
import { defineRoom } from 'colyseus';
import { ShipSetupInfo, NonCrewSystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { roomIdentifier } from 'common-data/utils/constants';
import { GameRoom } from 'src/classes/GameRoom';
import { beforeAll, afterAll, beforeEach } from 'vitest';
import type { IRandom } from 'common-data/types/IRandom';
import type { ServerConfig } from 'common-data/types/ServerConfig';
import type { GameState } from 'src/state/GameState';

const testServerConfig: ServerConfig = {
    ipAddress: '127.0.0.1',
    httpPort: 0,
    pingInterval: 3000,
    simulateLatencyMs: 0,
    tickRate: 20,
    patchRate: 20,
    multiship: false,
    timeScale: 1,
};

/**
 * Registers hooks that boot a Colyseus test server and give each test a fresh `GameRoom`.
 * Call at module level; call the returned `createState` inside a test.
 * The room's simulation loop is disabled so tests control time and ticking themselves.
 */
export function setupGameRoom() {
    let colyseus: ColyseusTestServer;
    let room: GameRoom;

    beforeAll(async () => {
        // boot() ignores the port when given a Server instance, so use the config form and pick a
        // per-worker port so test files running in parallel don't collide.
        colyseus = await boot({
            rooms: { [roomIdentifier]: defineRoom(GameRoom, testServerConfig) },
        } as unknown as Parameters<typeof boot>[0], 3100 + Number(process.env.VITEST_POOL_ID ?? 0));
    });

    afterAll(async () => {
        await colyseus.shutdown();
    });

    beforeEach(async () => {
        await colyseus.cleanup();
        room = await colyseus.createRoom<GameRoom>(roomIdentifier);
        room.setSimulationInterval();
    });

    return {
        /** The current test's room state, optionally with a deterministic random source. */
        createState(random?: IRandom): GameState {
            if (random) {
                Object.assign(room.state, { random });
            }
            return room.state;
        },
        /** The current test's room clock. */
        getClock() {
            return room.clock;
        },
    };
}

const minimalSystemSetup: NonCrewSystemSetupInfo = {
    cards: ['exampleNoTarget'],
    maxPowerLevel: 5,
    initialHandSize: 0,
};

/** A minimal, valid ship setup for tests. Spread and override per test. */
export function shipSetup(faction: string | undefined, x = 0, y = 0): ShipSetupInfo {
    return {
        name: 'Test',
        appearance: 'chevron',
        faction,
        position: { x, y, angle: 0 },
        hull: { ...minimalSystemSetup },
        reactor: { ...minimalSystemSetup, cards: ['reactorPowerHull', 'reactorPowerHelm', 'reactorPowerTactical', 'reactorPowerEngineer', 'reactorPowerScience', 'reactorPowerReactor', 'reactorPowerHull', 'reactorPowerHelm', 'reactorPowerTactical', 'reactorPowerEngineer', 'reactorPowerScience', 'reactorPowerReactor', 'reactorPowerHull', 'reactorPowerHelm', 'reactorPowerTactical', 'reactorPowerEngineer', 'reactorPowerScience', 'reactorPowerReactor'] },
        helm: { ...minimalSystemSetup },
        science: { ...minimalSystemSetup },
        tactical: { ...minimalSystemSetup, numSlots: 1 },
        engineer: { ...minimalSystemSetup },
    };
}

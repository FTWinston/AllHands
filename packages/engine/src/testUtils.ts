import { boot, type ColyseusTestServer } from '@colyseus/testing';
import { defineRoom } from 'colyseus';
import { Random } from 'common-data/classes/Random';
import { ShipSetupInfo, NonCrewSystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { roomIdentifier } from 'common-data/utils/constants';
import { Campaign } from 'src/campaign/Campaign';
import { factionConfigs, playerFactionId } from 'src/campaign/factions';
import { playerShipSetup } from 'src/campaign/playerShipSetup';
import { sectorThemes, type SectorTheme } from 'src/campaign/sectorThemes';
import { GameRoom } from 'src/classes/GameRoom';
import { PlayerShip } from 'src/state/PlayerShip';
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
        // Change scenes straight away, rather than waiting for screens to fade. Tests of the fading itself can set this back.
        room.state.sceneChangeDelay = 0;
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
        getRoom() {
            return room;
        },
        getServer() {
            return colyseus;
        },
    };
}

/** A deterministic random source (mulberry32), so generated content can be reproduced. */
export function seededRandom(seed: number): Random {
    let a = seed >>> 0;
    return new Random(() => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    });
}

/** Creates factions, one player ship per count, and a started campaign (in its first sector intro) on the state. */
export function startCampaign(state: GameState, shipCount = 1, themes: readonly SectorTheme[] = sectorThemes) {
    state.initFactions(factionConfigs, playerFactionId);

    const ships: PlayerShip[] = [];
    for (let i = 0; i < shipCount; i++) {
        const ship = new PlayerShip(state, playerShipSetup);
        state.add(ship);
        ships.push(ship);
    }

    const campaign = new Campaign(state, themes);
    state.campaign = campaign;
    campaign.start();

    return { campaign, ships };
}

/** At a station, does what the ship's crew must before helm can warp away: closes any open shop, then helm's deck view. */
export function finishAtStation(campaign: Campaign, ship: PlayerShip) {
    for (const system of ship.crewSystems) {
        if (system.shopOpen) {
            campaign.closeShop(ship, system);
        }
    }

    campaign.setDeckViewOpen(ship, ship.helmState, false);
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

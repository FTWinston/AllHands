import { boot, type ColyseusTestServer } from '@colyseus/testing';
import { defineRoom } from 'colyseus';
import { Random } from 'common-data/classes/Random';
import { crewRoleNames } from 'common-data/features/ships/types/CrewRole';
import { ShipSetupInfo, NonCrewSystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { roomIdentifier } from 'common-data/utils/constants';
import { Campaign } from 'src/campaign/Campaign';
import { playerFactionId } from 'src/campaign/factions';
import { playerShipSetup } from 'src/campaign/playerShipSetup';
import { sectorThemes, type SectorTheme } from 'src/campaign/sectorThemes';
import { GameRoom } from 'src/classes/GameRoom';
import { PlayerShip } from 'src/state/PlayerShip';
import { getPlayerShips } from 'src/utils/shipQueries';
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
        /**
         * Connect a ship client, so the room encodes its state on each patch, as a real game does.
         * Without a client, `broadcastPatch()` discards the changes without encoding them.
         */
        async connectClient() {
            // The test server's typings only accept a plain Room, not a Room with a typed state.
            await colyseus.connectTo(room as unknown as Parameters<ColyseusTestServer['connectTo']>[0], { type: 'ship' });
            return room;
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

/** Creates the player faction, one player ship per count, and a started campaign (in its first sector intro) on the state. */
export function startCampaign(state: GameState, shipCount = 1, themes: readonly SectorTheme[] = sectorThemes) {
    state.initFactions([{ id: playerFactionId }], playerFactionId);

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

/**
 * Settles whatever the crews of the given ships (by default, every player ship) have to choose before leaving the encounter:
 * the first salvaged card is taken, each crew member takes the first of their outfitting cards, and the crew votes for the first outfitting bundle.
 */
export function settleRewards(state: GameState, ships: readonly PlayerShip[] = getPlayerShips(state)) {
    const campaign = state.campaign!;

    for (const ship of ships) {
        if (ship.salvageChooser) {
            campaign.takeSalvage(ship, ship.salvageChooser, ship.salvage[0].card.id);
        }

        if (ship.outfitBundles.length > 0) {
            for (const role of crewRoleNames) {
                campaign.voteBundle(ship, role, 0);
            }
        }

        for (const role of crewRoleNames) {
            const system = ship.getCrewSystem(role);
            if (system.outfitCards.length > 0) {
                campaign.takeOutfitCard(ship, system, system.outfitCards[0].id);
            }
        }
    }
}

/** Dismisses the sector intro, then settles the outfitting choices and warps every player ship away from the start station, onto the sector map. */
export function leaveSectorStart(state: GameState) {
    const campaign = state.campaign!;
    campaign.dismissMessage();
    settleRewards(state);

    for (const ship of getPlayerShips(state)) {
        campaign.warpAway(ship);
    }
}

const minimalSystemSetup: NonCrewSystemSetupInfo = {
    cards: ['jam'],
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

/**
 * Lets game time pass in small steps, as the campaign would see it, and returns everything said over comms in that time, in order.
 * Only the campaign is ticked, not the objects in the game, so nothing moves.
 */
export function listenToHails(state: GameState, durationMs: number, stepMs = 100): { speaker: string; text: string }[] {
    const heard: { speaker: string; text: string }[] = [];
    let current = state.hail;

    for (let elapsed = 0; elapsed < durationMs; elapsed += stepMs) {
        state.currentTime += stepMs;
        state.campaign?.tick(stepMs);

        if (state.hail && state.hail !== current) {
            heard.push({ speaker: state.hail.speaker, text: state.hail.text });
        }
        current = state.hail;
    }

    return heard;
}

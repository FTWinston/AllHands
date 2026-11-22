import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { getHailDuration } from 'common-data/features/sectors/types/HailInfo';
import { ownEngineerClientRole, ownHelmClientRole, ownScienceClientRole, ownTacticalClientRole } from 'common-data/features/ships/types/CrewRole';
import { cardSellPrice, minDeckSize } from 'common-data/features/ships/utils/antimatter';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { offerAnswers, offerAtMs } from 'content/sectors/sector1/slowBoat/slowBoat.engine';
import { playerFactionId } from 'src/campaign/factions';
import { getCardDefinition } from 'src/cards/getEngineCardDefinition';
import { DEV_TOOLS_ENABLED } from 'src/devTools';
import { CardState } from 'src/state/CardState';
import { CrewState } from 'src/state/CrewState';
import { SensorGhost } from 'src/state/SensorGhost';
import { settleRewards, setupGameRoom, startCampaign } from 'src/testUtils';
import { getHostileShips, getPlayerShips } from 'src/utils/shipQueries';
import { describe, expect, it, vi } from 'vitest';
import { startCountdownDuration, type GameRoom } from './GameRoom';
import type { IArray } from '@colyseus/react';
import type { ColyseusTestServer } from '@colyseus/testing';
import type { EngineWeaponSlotCardDefinition } from 'src/cards/EngineCardDefinition';
import type { PlayerShip } from 'src/state/PlayerShip';
import type { HullSystemTile } from 'src/state/systems/engineer/HullSystemTile';

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
async function claimAllRoles(shipOptions: object = {}) {
    const room = rooms.getRoom();

    const shipClient = await connect(room, { type: 'ship', ...shipOptions });
    const [crewId] = [...room.state.crews.keys()];

    const clients = {} as Record<RoleName, TestClient>;
    for (const role of roles) {
        clients[role] = await connect(room, { type: 'crew', crewId });
        await send(room, clients[role], 'role', roleIds[role]);
    }

    return { room, crewId, shipClient, clients };
}

/** Tactical dismisses the sector intro, then the crew settles their outfitting choices and the ship warps away from the start station, onto the map. */
async function leaveStart(room: GameRoom, state: GameRoom['state'], clients: Record<RoleName, TestClient>) {
    await send(room, clients.tactical, 'dismissMessage');
    expect(state.encounterKind).toBe('outfitting');
    settleRewards(state);

    // Directly, rather than by playing the card: with no scene change delay, the played card would land in the deck after it's been reset for the map.
    expect(state.campaign!.warpAway(getPlayerShips(state)[0])).toBe(true);
    expect(state.phase).toBe('map');
}

/** A ship client plus one crew client per role, so the campaign has started. */
async function startGame(shipOptions: object = {}) {
    const { room, crewId, shipClient, clients } = await claimAllRoles(shipOptions);

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

        // The ship docks at the sector's outfitting station.
        await send(room, clients.tactical, 'dismissMessage');
        expect(state.phase).toBe('encounter');
        expect(state.encounterKind).toBe('outfitting');

        // Outside an intro or outro, even tactical is ignored.
        await send(room, clients.tactical, 'dismissMessage');
        expect(state.phase).toBe('encounter');
    });

    it('only helm can play a route card, and only on the map', async () => {
        const { room, state, ship, clients } = await startGame();
        const playRoute = (role: RoleName, cardId: number) => send(room, clients[role], 'playNonEncounterCard', { cardId });

        await leaveStart(room, state, clients);
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
        await leaveStart(room, state, clients);
        await send(room, clients.helm, 'playNonEncounterCard', { cardId: ship.helmState.nonEncounterCards[0].id });
        expect(state.phase).toBe('encounter');

        // The card has not been offered, so a guessed id does nothing.
        await send(room, clients.helm, 'playCard', { cardId: 9999, cardType: 'warpAway', targetType: 'no-target', targetId: '' });
        expect(state.phase).toBe('encounter');

        for (const hostile of getHostileShips(state)) {
            hostile.destroy();
        }
        // Survive and boss objectives are not met by clearing hostiles, so finish those directly.
        if (state.encounter!.outcome === null) {
            state.currentTime += state.campaign!.activeEncounter!.objectiveEndTime;
            state.campaign!.tick(0);
        }

        const warpCard = ship.helmState.hand.find(card => card.type === 'warpAway')!;
        expect(warpCard).toBeDefined();

        await send(room, clients.helm, 'playCard', { cardId: warpCard.id, cardType: 'warpAway', targetType: 'no-target', targetId: '' });
        expect(state.phase).toBe('map');
        expect(ship.helmState.hand.some(card => card.type === 'warpAway')).toBe(false);
    });

    it('each crew member can re-order and sell from only their own deck at a station', async () => {
        const { room, state, ship, clients } = await startGame();
        await leaveStart(room, state, clients);

        // Not at a station yet, so ignored.
        const helmOrder = ship.helmState.deck.map(card => card.id);
        await send(room, clients.helm, 'moveDeckCard', { cardId: helmOrder[1], toIndex: 0 });
        expect(ship.helmState.deck.map(card => card.id)).toEqual(helmOrder);

        expect(state.campaign!.devLoadEncounter('repairStation')).toBe(true);

        await send(room, clients.helm, 'moveDeckCard', { cardId: helmOrder[1], toIndex: 0 });
        expect(ship.helmState.deck.map(card => card.id)).toEqual([helmOrder[1], helmOrder[0], ...helmOrder.slice(2)]);

        // Moving a card later in the deck too, and helm's client sees the same order as the server.
        await send(room, clients.helm, 'moveDeckCard', { cardId: helmOrder[1], toIndex: 3 });
        expect(ship.helmState.deck.map(card => card.id)).toEqual([helmOrder[0], helmOrder[2], helmOrder[3], helmOrder[1], ...helmOrder.slice(4)]);
        await vi.waitFor(() => {
            const clientShip = (clients.helm.state as typeof state).objects.get(ship.id) as typeof ship;
            expect(clientShip.helmState.deck.map(card => card.id)).toEqual(ship.helmState.deck.map(card => card.id));
        });

        // Tactical can't sell helm's card, but can sell its own.
        const tacticalCount = ship.tacticalState.deck.length;
        await send(room, clients.tactical, 'sellDeckCard', { cardId: ship.helmState.deck[0].id });
        expect(ship.antimatter).toBe(0);

        await send(room, clients.tactical, 'sellDeckCard', { cardId: ship.tacticalState.deck[0].id });
        expect(ship.tacticalState.deck.length).toBe(tacticalCount - 1);
        expect(ship.antimatter).toBe(cardSellPrice);

        // Helm can sell down to the minimum deck size, and no further.
        const helmSales = helmOrder.length - minDeckSize;
        for (let sale = 0; sale < helmSales; sale++) {
            await send(room, clients.helm, 'sellDeckCard', { cardId: ship.helmState.deck[0].id });
        }
        expect(ship.helmState.deck.length).toBe(minDeckSize);
        expect(ship.antimatter).toBe(cardSellPrice * (1 + helmSales));

        await send(room, clients.helm, 'sellDeckCard', { cardId: ship.helmState.deck[0].id });
        expect(ship.helmState.deck.length).toBe(minDeckSize);
        expect(ship.antimatter).toBe(cardSellPrice * (1 + helmSales));
    });

    it('sends an order preview only to the crew member who asked for it', async () => {
        const { room, state, ship, clients } = await startGame();
        await send(room, clients.tactical, 'dismissMessage');
        expect(state.campaign!.devLoadEncounter('navigationBeacon')).toBe(true);

        const tacticalPreviews: unknown[] = [];
        const helmPreviews: unknown[] = [];
        clients.tactical.onMessage('orderPreview', preview => tacticalPreviews.push(preview));
        clients.helm.onMessage('orderPreview', preview => helmPreviews.push(preview));

        const spec = ship.tacticalState.deck.find(card => card.type === 'photonTorpedo')!;
        await send(room, clients.tactical, 'previewOrder', { cardId: spec.id });

        await vi.waitFor(() => expect(tacticalPreviews).toEqual([expect.objectContaining({ specCardId: spec.id })]));
        expect(helmPreviews).toEqual([]);
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

describe('GameRoom encounter factions', () => {
    it('clients see who is hostile for as long as the encounter lasts, through the player faction they already hold', async () => {
        const { room, state, ship, shipClient, clients } = await startGame();
        const getRelations = (client: TestClient) => (client.state as GameRoom['state']).factions.get(playerFactionId)?.relations;

        await vi.waitFor(() => {
            expect(getRelations(shipClient)?.size).toBe(0);
        });

        await send(room, clients.tactical, 'dismissMessage');
        expect(state.campaign!.devLoadEncounter('skirmish')).toBe(true);

        const [faction] = [...state.factions.keys()].filter(id => id !== playerFactionId);
        expect(faction).toBeDefined();

        await vi.waitFor(() => {
            for (const client of [shipClient, clients.helm, clients.tactical]) {
                expect(getRelations(client)?.get(faction)).toBe(RelationshipType.Hostile);
                // Only the player faction is ever sent: the encounter's faction stays on the server.
                expect([...(client.state as GameRoom['state']).factions.keys()]).toEqual([playerFactionId]);
            }
        });

        for (const hostile of getHostileShips(state)) {
            hostile.destroy();
        }
        settleRewards(state);
        expect(state.campaign!.warpAway(ship)).toBe(true);

        await vi.waitFor(() => {
            for (const client of [shipClient, clients.helm, clients.tactical]) {
                expect(getRelations(client)?.size).toBe(0);
            }
        });
    });
});

describe('GameRoom viewscreen readouts', () => {
    it('the viewscreen is sent the objective, what is being said, and how the encounter ended', async () => {
        const { room, state, ship, shipClient, clients } = await startGame();
        const getState = () => shipClient.state as GameRoom['state'];

        await send(room, clients.tactical, 'dismissMessage');
        expect(state.campaign!.devLoadEncounter('tollCollectors')).toBe(true);

        await vi.waitFor(() => {
            expect(getState().objective).toMatchObject({ type: 'clear' });
            expect(getState().hail).toMatchObject({ speaker: 'Warden Cruiser Assize' });
            expect(getState().encounterOutcome ?? null).toBeNull();
        });

        for (const hostile of getHostileShips(state)) {
            hostile.destroy();
        }

        // Whoever asked for help has the last word, once everything else has been read.
        for (let lines = 0; lines < 5 && state.hail?.speaker !== 'Hauler Local 12'; lines++) {
            state.currentTime += getHailDuration(state.hail!.text);
            state.campaign!.tick(0);
        }

        await vi.waitFor(() => {
            expect(getState().encounterOutcome).toBe('success');
            expect(getState().hail).toMatchObject({ speaker: 'Hauler Local 12' });
        });

        settleRewards(state);
        expect(state.campaign!.warpAway(ship)).toBe(true);

        await vi.waitFor(() => {
            expect(getState().objective ?? null).toBeNull();
            expect(getState().hail ?? null).toBeNull();
            expect(getState().encounterOutcome ?? null).toBeNull();
        });
    });
});

describe('GameRoom comms prompts', () => {
    it('the viewscreen and tactical are sent what is being asked, and only tactical can answer it', async () => {
        const { room, state, ship, shipClient, clients } = await startGame();
        const getShip = (client: TestClient) => (client.state as GameRoom['state']).objects.get(ship.id) as PlayerShip | undefined;
        const getPrompt = (client: TestClient) => getShip(client)?.comms?.prompt ?? null;

        // The elite form of Slow Boat, whose harriers make an offer a minute in.
        await send(room, clients.tactical, 'dismissMessage');
        // (Loaded directly, rather than with the devLoadEncounter message, which only works in dev tools builds.)
        expect(state.campaign!.devLoadEncounter('slowBoat', true)).toBe(true);
        expect(state.encounter).toMatchObject({ encounterId: 'slowBoat' });
        state.currentTime += offerAtMs;
        state.campaign!.tick(0);
        expect(state.prompt).not.toBeNull();

        await vi.waitFor(() => {
            for (const client of [shipClient, clients.tactical]) {
                expect(getPrompt(client)).toMatchObject({ speaker: 'Stranded Lead' });
                expect(getPrompt(client)!.options.map(option => option.id)).toEqual([offerAnswers.handOver, offerAnswers.refuse]);
            }
        });

        // Nobody else needs it, as they can't answer it, and the viewscreen shows it to them.
        for (const role of ['helm', 'science', 'engineer'] as const) {
            expect(getShip(clients[role])).toBeDefined();
            expect(getShip(clients[role])!.comms).toBeUndefined();
        }

        for (const role of ['helm', 'science', 'engineer'] as const) {
            await send(room, clients[role], 'answerPrompt', { optionId: offerAnswers.handOver });
            expect(state.prompt).not.toBeNull();
        }

        // Nor can tactical give an answer that wasn't on offer.
        await send(room, clients.tactical, 'answerPrompt', { optionId: 'somethingElse' });
        await send(room, clients.tactical, 'answerPrompt', {});
        expect(state.prompt).not.toBeNull();

        await send(room, clients.tactical, 'answerPrompt', { optionId: offerAnswers.handOver });
        expect(state.prompt).toBeNull();
        expect(getHostileShips(state).every(ship => ship.ai.commander.isWithdrawing)).toBe(true);

        await vi.waitFor(() => {
            expect(getPrompt(shipClient)).toBeNull();
            expect(getPrompt(clients.tactical)).toBeNull();
        });
    });
});

describe('GameRoom engineer system cards', () => {
    /** Start the game and enter the first encounter, where hands are dealt. */
    async function startEncounter() {
        const game = await startGame();
        await leaveStart(game.room, game.state, game.clients);
        await send(game.room, game.clients.helm, 'playNonEncounterCard', { cardId: game.ship.helmState.nonEncounterCards[0].id });
        expect(game.state.phase).toBe('encounter');
        // Tile copies of each system's cards are updated as the ship ticks.
        game.ship.tick(0, game.state.currentTime);
        return game;
    }

    function getClientShip(client: TestClient, ship: { id: string }) {
        return (client.state as GameRoom['state']).objects.get(ship.id) as PlayerShip;
    }

    const cardIds = (cards: IArray<{ id: number }>) => cards.map(card => card.id);

    it('engineer sees every system\'s hand and deck through its tiles, without seeing other systems\' state', async () => {
        const { ship, clients } = await startEncounter();

        await vi.waitFor(() => {
            const engineerShip = getClientShip(clients.engineer, ship);
            for (const tile of ship.engineerState.systems) {
                const clientTile = engineerShip.engineerState.systems.find(t => t.system === tile.system)!;
                expect(cardIds(clientTile.hand)).toEqual(cardIds(tile.hand));
                expect(cardIds(clientTile.deck)).toEqual(cardIds(tile.deck));
            }
            expect(engineerShip.helmState).toBeUndefined();
            expect(engineerShip.tacticalState).toBeUndefined();
        });

        // Helm's own view of its cards is unaffected.
        await vi.waitFor(() => {
            const helmShip = getClientShip(clients.helm, ship);
            expect(cardIds(helmShip.helmState.hand)).toEqual(cardIds(ship.helmState.hand));
            expect(cardIds(helmShip.helmState.deck)).toEqual(cardIds(ship.helmState.deck));
        });
    });

    it('engineer sees changes to other systems\' cards, including extra traits', async () => {
        const { state, ship, clients } = await startEncounter();

        ship.helmState.discard();
        ship.helmState.deck[2].addTrait('expendable', ExtraTraitType.Normal);
        ship.tick(0, state.currentTime);

        await vi.waitFor(() => {
            const engineerShip = getClientShip(clients.engineer, ship);
            const helmTile = engineerShip.engineerState.systems.find(t => t.system === 'helm')!;
            expect(cardIds(helmTile.hand)).toEqual(cardIds(ship.helmState.hand));
            expect(cardIds(helmTile.deck)).toEqual(cardIds(ship.helmState.deck));
            expect(helmTile.deck[2].extraTraits.get('expendable')).toBe(ExtraTraitType.Normal);
        });

        await vi.waitFor(() => {
            const helmShip = getClientShip(clients.helm, ship);
            expect(cardIds(helmShip.helmState.deck)).toEqual(cardIds(ship.helmState.deck));
            expect(helmShip.helmState.deck[2].extraTraits.get('expendable')).toBe(ExtraTraitType.Normal);
        });
    });

    it('tactical and the engineer both see cards being damaged, stabilised and critically damaged', async () => {
        const { state, ship, clients } = await startEncounter();
        const tactical = ship.tacticalState;

        const traitsOf = (cards: IArray<{ id: number; extraTraits?: { keys(): Iterable<string> } }>) =>
            cards.map(card => [card.id, [...card.extraTraits?.keys() ?? []].sort()]);

        const expectClientsMatch = async () => {
            ship.tick(0, state.currentTime);

            await vi.waitFor(() => {
                const tacticalShip = getClientShip(clients.tactical, ship);
                expect(traitsOf(tacticalShip.tacticalState.hand)).toEqual(traitsOf(tactical.hand));
                expect(traitsOf(tacticalShip.tacticalState.deck)).toEqual(traitsOf(tactical.deck));

                const engineerTile = getClientShip(clients.engineer, ship).engineerState.systems.find(t => t.system === 'tactical')!;
                expect(traitsOf(engineerTile.hand)).toEqual(traitsOf(tactical.hand));
                expect(traitsOf(engineerTile.deck)).toEqual(traitsOf(tactical.deck));
                expect(engineerTile.health).toBe(tactical.health);
            });
        };

        const maxHealth = tactical.maxHealth;

        tactical.adjustHealth(-maxHealth);
        expect(tactical.health).toBe(0);
        await expectClientsMatch();

        tactical.adjustHealth(maxHealth);
        expect(tactical.health).toBe(maxHealth);
        await expectClientsMatch();

        // One hit at a time, as the system would take them in an encounter.
        for (let i = 0; i < maxHealth; i++) {
            tactical.adjustHealth(-1);
            await expectClientsMatch();
        }
        expect(tactical.health).toBe(0);
    });

    it.each(['helm', 'tactical', 'science'] as const)('%s sees its own cards being damaged as they move between hand and deck', async (role) => {
        const { state, ship, clients } = await startEncounter();
        const system = ship[`${role}State`];

        const traitsOf = (cards: IArray<{ id: number; extraTraits?: { keys(): Iterable<string> } }>) =>
            cards.map(card => [card.id, [...card.extraTraits?.keys() ?? []].sort()]);

        const expectClientMatches = async () => {
            ship.tick(0, state.currentTime);

            await vi.waitFor(() => {
                const clientSystem = getClientShip(clients[role], ship)[`${role}State`];
                expect(traitsOf(clientSystem.hand)).toEqual(traitsOf(system.hand));
                expect(traitsOf(clientSystem.deck)).toEqual(traitsOf(system.deck));
            });
        };

        await expectClientMatches();

        for (let i = 0; i < system.maxHealth; i++) {
            // Cards leave the hand and others are drawn, as they would be in play.
            system.discard();
            await expectClientMatches();

            system.adjustHealth(-1);
            await expectClientMatches();
        }
    });

    it('science and tactical both see the hull of the ship science is scanning, and no one else does', async () => {
        const { state, ship, clients } = await startEncounter();
        const [enemy] = getHostileShips(state);
        expect(enemy).toBeDefined();

        ship.scienceState.subscribeToSystem(enemy, 'helm');
        // Enemies start an encounter with full shields.
        (enemy.engineerState.systems.find(tile => tile.system === 'hull') as HullSystemTile).setShield(enemy.hullState.maxShield - 25);

        for (const role of ['science', 'tactical'] as const) {
            await vi.waitFor(() => {
                expect(getClientShip(clients[role], ship).scannedHull).toMatchObject({
                    targetId: enemy.id,
                    health: enemy.hullState.health,
                    maxHealth: enemy.hullState.maxHealth,
                    shield: enemy.hullState.maxShield - 25,
                    maxShield: enemy.hullState.maxShield,
                });
            });
        }

        for (const role of ['helm', 'engineer'] as const) {
            expect(getClientShip(clients[role], ship).scannedHull).toBeUndefined();
        }
    });
});

describe('GameRoom game start', () => {
    it('fades the lobby out once the start countdown ends, before starting the game', async () => {
        const { room } = await claimAllRoles();
        room.state.sceneChangeDelay = 20;

        room.tickStartCountdown(startCountdownDuration);

        expect(room.state.sceneChange).toBe('start');
        expect(room.state.gameStatus).toBe('setup');

        await new Promise(resolve => setTimeout(resolve, 40));
        room.clock.tick();

        expect(room.state.sceneChange).toBeNull();
        expect(room.state.gameStatus).toBe('active');
    });

    it('counts the card types the ship client already knows as seen, ignoring anything that cannot be known', async () => {
        const { ship } = await startGame({ knownCardTypes: ['shunt', 'warpAway', 'notACard', 7, 'lowYield'] });

        expect(ship.seenCardTypes).toContain('shunt');
        expect(ship.seenCardTypes).toContain('lowYield');
        expect(ship.seenCardTypes).not.toContain('warpAway');
        expect(ship.seenCardTypes).not.toContain('notACard');
    });

    it('ignores known card types sent as anything other than a list', async () => {
        const { ship } = await startGame({ knownCardTypes: 'shunt' });

        expect(ship.seenCardTypes).not.toContain('shunt');
    });
});

describe('GameRoom player ship destruction', () => {
    const wait = () => new Promise(resolve => setTimeout(resolve, 50));

    it('ends the game with the crew still assigned, so their clients can show the outcome', async () => {
        const { state, ship, shipClient } = await startGame();
        const crew = [...state.crews.values()][0];

        const shipMessages: unknown[] = [];
        shipClient.onMessage('ship', message => shipMessages.push(message));

        ship.destroy();
        await wait();

        expect(state.gameStatus).toBe('ended');
        expect(state.outcome).toBe('defeat');
        expect(crew.shipId).toBe(ship.id);
        expect(shipMessages).not.toContainEqual({ shipId: null });
    });

    it('sends the viewscreen an explosion that says where the ship was, as the ship itself will be gone', async () => {
        const { state, ship, shipClient } = await startGame();

        const effects: unknown[] = [];
        shipClient.onMessage('weaponEffect', effect => effects.push(effect));

        const { x, y } = ship.getPosition(state.currentTime);
        ship.destroy();
        await wait();

        expect(effects).toContainEqual(expect.objectContaining({ type: 'explosion', sourceId: ship.id, position: expect.objectContaining({ x, y }) }));
    });

    it('sends the viewscreen a weapon being fired and it landing, saying how much damage got through', async () => {
        const { state, ship, shipClient } = await startGame();

        const effects: unknown[] = [];
        shipClient.onMessage('weaponEffect', effect => effects.push(effect));

        const card = getCardDefinition('phaserCannon') as EngineWeaponSlotCardDefinition;
        card.fire(state, ship, ship, { cost: 0, damage: 1 }, 100, [], null);
        await wait();

        expect(effects).toEqual([
            expect.objectContaining({ type: 'shot', weapon: 'phaserCannon', sourceId: ship.id, targetId: ship.id }),
            expect.objectContaining({ type: 'impact', sourceId: ship.id, targetId: ship.id, damage: expect.any(Number) }),
        ]);
    });

    it('can still pause and resume after one crew has lost their ship, even if their roles changed', async () => {
        const room = rooms.getRoom();
        const shipClient = await connect(room, { type: 'ship' });
        const [lostCrew] = [...room.state.crews.values()];
        const crewClient = await connect(room, { type: 'crew', crewId: lostCrew.crewId });

        const { ships: [lostShip, survivingShip] } = startCampaign(room.state, 2);
        const survivingCrew = new CrewState(room.clients, '', 'survivors');
        room.state.crews.set(survivingCrew.crewId, survivingCrew);
        lostCrew.setShip(lostShip);
        survivingCrew.setShip(survivingShip);
        room.startOrResume();
        expect(shipClient.sessionId).toBe(lostCrew.shipClientId);

        lostShip.destroy();
        expect(room.state.gameStatus).toBe('active');

        room.pause();
        expect(room.state.gameStatus).toBe('paused');

        lostCrew.helmClientId = crewClient.sessionId;
        const addToView = vi.spyOn(room.clients.getById(crewClient.sessionId)!.view!, 'add');

        room.startOrResume();

        expect(room.state.gameStatus).toBe('active');
        expect(addToView).not.toHaveBeenCalledWith(lostShip, expect.anything());
    });
});

describe('GameRoom sensor ghosts', () => {
    async function startEncounter() {
        const game = await startGame();
        await leaveStart(game.room, game.state, game.clients);
        await send(game.room, game.clients.helm, 'playNonEncounterCard', { cardId: game.ship.helmState.nonEncounterCards[0].id });
        expect(game.state.phase).toBe('encounter');
        game.ship.tick(0, game.state.currentTime);
        return game;
    }

    /** What a client has been sent of an object, or undefined if it has been sent nothing. */
    function sent(client: TestClient, id: string) {
        return (client.state as GameRoom['state']).objects.get(id) as (SensorGhost & Record<string, unknown>) | undefined;
    }

    it('is sent to every client of a crew it fools exactly as the ship it copies is, with nothing to say it is a ghost', async () => {
        const { state, ship, shipClient, clients } = await startEncounter();
        const [enemy] = getHostileShips(state);
        const ghost = new SensorGhost(state, enemy, 15_000);
        state.add(ghost);

        // Known to the ship wherever it is, so that it's sent to its crew.
        ship.revealObject(ghost.id, 60_000);
        ship.revealObject(enemy.id, 60_000);

        for (const client of [shipClient, clients.helm, clients.tactical, clients.science]) {
            await vi.waitFor(() => expect(sent(client, ghost.id)).toBeDefined());

            const ghostData = sent(client, ghost.id)!;
            const enemyData = sent(client, enemy.id)!;
            expect(ghostData.isSensorGhost).toBeUndefined();
            expect(ghostData.faction).toBe(enemyData.faction);
            expect(ghostData.name).toBe(enemyData.name);
            expect(ghostData.appearance).toBe(enemyData.appearance);
        }
    });

    it('is sent to the helm and viewscreen of its own side as a ghost, and not to its tactical and science, which can only target ships', async () => {
        const { state, ship, shipClient, clients } = await startEncounter();
        const ghost = new SensorGhost(state, ship, 15_000);
        state.add(ghost);
        ship.updateKnownObjects(state.currentTime);

        for (const client of [shipClient, clients.helm]) {
            await vi.waitFor(() => expect(sent(client, ghost.id)).toBeDefined());
            expect(sent(client, ghost.id)!.isSensorGhost).toBe(true);
            expect(sent(client, ghost.id)!.name).toBe(ship.name);
        }

        // Let anything that was going to reach them do so.
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(sent(clients.tactical, ghost.id)).toBeUndefined();
        expect(sent(clients.science, ghost.id)).toBeUndefined();
        expect(sent(clients.engineer, ghost.id)).toBeUndefined();
    });
});

describe('GameRoom card rewards', () => {
    const shipFor = (client: TestClient, ship: PlayerShip) => (client.state as GameRoom['state']).objects.get(ship.id) as PlayerShip | undefined;
    // Decoded on the client without the server's methods, so found by field name.
    const systemFor = (client: TestClient, ship: PlayerShip, role: RoleName) => shipFor(client, ship)?.[`${role}State`];

    it('lets each crew member take one of their own outfitting cards, then gives helm Warp Away', async () => {
        const { room, state, ship, shipClient, clients } = await startGame();
        await send(room, clients.tactical, 'dismissMessage');
        expect(state.encounterKind).toBe('outfitting');

        for (const role of roles) {
            await vi.waitFor(() => {
                expect(systemFor(clients[role], ship, role)?.outfitCards.length).toBe(3);
            });
        }

        // The viewscreen can't see anyone's cards, but can see who is still choosing.
        await vi.waitFor(() => {
            expect([...shipFor(shipClient, ship)?.outfitPickers ?? []].sort()).toEqual([...roles].sort());
        });
        expect(shipFor(shipClient, ship)?.helmState).toBeUndefined();
        for (const role of roles) {
            expect(shipFor(clients[role], ship)?.outfitPickers?.length ?? 0).toBe(0);
        }

        // Nobody can take another crew member's card.
        await send(room, clients.science, 'takeOutfitCard', { cardId: ship.helmState.outfitCards[0].id });
        expect(ship.helmState.outfitCards.length).toBe(3);

        for (const role of roles) {
            const system = ship.getCrewSystem(role);
            const [card] = system.outfitCards;
            await send(room, clients[role], 'takeOutfitCard', { cardId: card.id });
            expect(system.deck.at(-1)).toBe(card);
            await vi.waitFor(() => {
                expect(shipFor(shipClient, ship)?.outfitPickers.includes(role)).toBe(false);
            });
        }

        expect(ship.helmState.hand.some(card => card.type === 'warpAway')).toBe(true);
    });

    it('shows salvage to the viewscreen and every crew member, and only the chooser can take or scrap it', async () => {
        const { room, state, ship, shipClient, clients } = await startGame();
        await leaveStart(room, state, clients);
        expect(state.campaign!.devLoadEncounter('skirmish')).toBe(true);
        for (const hostile of getHostileShips(state)) {
            hostile.destroy();
        }

        // Salvage comes once the ship has warped away, to the map.
        expect(ship.salvage.length).toBe(0);
        const warpCard = ship.helmState.hand.find(hand => hand.type === 'warpAway')!;
        await send(room, clients.helm, 'playCard', { cardId: warpCard.id, cardType: 'warpAway', targetType: 'no-target', targetId: '' });
        expect(state.phase).toBe('map');

        const chooser = ship.salvageChooser as RoleName;
        expect(chooser).not.toBe('');
        for (const client of [shipClient, ...roles.map(role => clients[role])]) {
            await vi.waitFor(() => {
                expect(shipFor(client, ship)?.salvage.length).toBe(3);
                expect(shipFor(client, ship)?.salvageChooser).toBe(chooser);
            });
        }

        const other = roles.find(role => role !== chooser)!;
        const { role: recipient, card } = ship.salvage[0];
        const deckSize = ship.getCrewSystem(recipient).deck.length;
        const antimatter = ship.antimatter;

        await send(room, clients[other], 'scrapSalvage');
        await send(room, clients[other], 'takeSalvage', { cardId: card.id });
        await send(room, clients[other], 'hideSalvage', { hidden: true });
        expect(ship.salvage.length).toBe(3);
        expect(ship.antimatter).toBe(antimatter);
        expect(ship.salvageHidden).toBe(false);

        // Only the viewscreen needs to know the chooser is holding the salvage out of the way.
        await send(room, clients[chooser], 'hideSalvage', { hidden: true });
        expect(ship.salvageHidden).toBe(true);
        await vi.waitFor(() => {
            expect(shipFor(shipClient, ship)?.salvageHidden).toBe(true);
        });
        for (const role of roles) {
            expect(shipFor(clients[role], ship)?.salvageHidden ?? false).toBe(false);
        }

        await send(room, clients[chooser], 'takeSalvage', { cardId: card.id });
        expect(ship.salvage.length).toBe(0);
        expect(ship.salvageHidden).toBe(false);
        expect(ship.getCrewSystem(recipient).deck.length).toBe(deckSize + 1);
        expect(ship.helmState.nonEncounterCards.length).toBe(state.map!.availableNodeIds.length);
    });

    it('lets a crew member with a full deck replace a card with the one waiting, outside an encounter', async () => {
        const { room, state, ship, clients } = await startGame();
        await leaveStart(room, state, clients);

        const tactical = ship.tacticalState;
        while (!tactical.isDeckFull) {
            tactical.gainCard(new CardState(ship.getCardId(), 'phaserStrip'));
        }
        tactical.gainCard(new CardState(ship.getCardId(), 'quantumTorpedo'));

        await vi.waitFor(() => {
            expect(systemFor(clients.tactical, ship, 'tactical')?.incomingCards.length).toBe(1);
        });

        const antimatter = ship.antimatter;
        await send(room, clients.tactical, 'replaceDeckCard', { cardId: tactical.deck[0].id });
        expect(tactical.incomingCards.length).toBe(0);
        expect(tactical.deck.at(-1)!.type).toBe('quantumTorpedo');
        expect(ship.antimatter).toBe(antimatter + cardSellPrice);
    });
});

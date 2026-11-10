import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { ownEngineerClientRole, ownHelmClientRole, ownScienceClientRole, ownTacticalClientRole } from 'common-data/features/ships/types/CrewRole';
import { cardSellPrice } from 'common-data/features/ships/utils/antimatter';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { playerFactionId } from 'src/campaign/factions';
import { getCardDefinition } from 'src/cards/getEngineCardDefinition';
import { getDefaultNode } from 'src/encounters/EncounterRegistry';
import { offerAnswers, offerAtMs } from 'src/encounters/SlowBoatEncounter';
import { DEV_TOOLS_ENABLED } from 'src/generated/devtools';
import { CrewState } from 'src/state/CrewState';
import { setupGameRoom, startCampaign } from 'src/testUtils';
import { getHostileShips } from 'src/utils/shipQueries';
import { describe, expect, it, vi } from 'vitest';
import { startCountdownDuration, type GameRoom } from './GameRoom';
import type { IArray } from '@colyseus/react';
import type { ColyseusTestServer } from '@colyseus/testing';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
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
        await send(room, clients.tactical, 'dismissMessage');

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

        // Helm's deck is already at the minimum size.
        await send(room, clients.helm, 'sellDeckCard', { cardId: ship.helmState.deck[0].id });
        expect(ship.helmState.deck.length).toBe(helmOrder.length);
        expect(ship.antimatter).toBe(cardSellPrice);
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

describe('GameRoom encounter sides', () => {
    it('clients see who is hostile for as long as the encounter lasts, through the player faction they already hold', async () => {
        const { room, state, ship, shipClient, clients } = await startGame();
        const getRelations = (client: TestClient) => (client.state as GameRoom['state']).factions.get(playerFactionId)?.relations;

        await vi.waitFor(() => {
            expect(getRelations(shipClient)?.size).toBe(0);
        });

        await send(room, clients.tactical, 'dismissMessage');
        expect(state.campaign!.devLoadEncounter('skirmish')).toBe(true);

        const [side] = [...state.factions.keys()].filter(id => id !== playerFactionId);
        expect(side).toBeDefined();

        await vi.waitFor(() => {
            for (const client of [shipClient, clients.helm, clients.tactical]) {
                expect(getRelations(client)?.get(side)).toBe(RelationshipType.Hostile);
                // Only the player faction is ever sent: the side itself stays on the server.
                expect([...(client.state as GameRoom['state']).factions.keys()]).toEqual([playerFactionId]);
            }
        });

        for (const hostile of getHostileShips(state)) {
            hostile.destroy();
        }
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

        await vi.waitFor(() => {
            expect(getState().encounterOutcome).toBe('success');
            expect(getState().hail).toMatchObject({ speaker: 'Hauler Local 12' });
        });

        expect(state.campaign!.warpAway(ship)).toBe(true);

        await vi.waitFor(() => {
            expect(getState().objective ?? null).toBeNull();
            expect(getState().hail ?? null).toBeNull();
            expect(getState().encounterOutcome ?? null).toBeNull();
        });
    });
});

describe('GameRoom comms prompts', () => {
    it('everyone is sent what is being asked, but only tactical can answer it', async () => {
        const { room, state, shipClient, clients } = await startGame();
        const getPrompt = (client: TestClient) => (client.state as GameRoom['state']).prompt ?? null;

        // The elite form of Slow Boat, whose harriers make an offer a minute in.
        await send(room, clients.tactical, 'dismissMessage');
        (state.campaign as unknown as { startEncounter(node: SectorNodeInfo): void }).startEncounter({ ...getDefaultNode('slowBoat'), elite: true });
        state.currentTime += offerAtMs;
        state.campaign!.tick(0);
        expect(state.prompt).not.toBeNull();

        await vi.waitFor(() => {
            for (const client of [shipClient, clients.tactical]) {
                expect(getPrompt(client)).toMatchObject({ speaker: 'Stranded Lead' });
                expect(getPrompt(client)!.options.map(option => option.id)).toEqual([offerAnswers.handOver, offerAnswers.refuse]);
            }
        });

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
        await send(game.room, game.clients.tactical, 'dismissMessage');
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
        const { ship } = await startGame({ knownCardTypes: ['purge', 'warpAway', 'notACard', 7, 'zigZag'] });

        expect(ship.seenCardTypes).toContain('purge');
        expect(ship.seenCardTypes).toContain('zigZag');
        expect(ship.seenCardTypes).not.toContain('warpAway');
        expect(ship.seenCardTypes).not.toContain('notACard');
    });

    it('ignores known card types sent as anything other than a list', async () => {
        const { ship } = await startGame({ knownCardTypes: 'purge' });

        expect(ship.seenCardTypes).not.toContain('purge');
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
        card.fire(state, ship, ship, { cost: 0, damage: 1 }, 100, []);
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

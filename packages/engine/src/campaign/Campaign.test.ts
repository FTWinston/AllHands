import { PlayerShip } from 'src/state/PlayerShip';
import { seededRandom, setupGameRoom, startCampaign } from 'src/testUtils';
import { getHostileShips } from 'src/utils/shipQueries';
import { describe, expect, it } from 'vitest';
import { playerShipSetup } from './playerShipSetup';
import { sectorThemes } from './sectorThemes';
import type { GameState } from 'src/state/GameState';

const rooms = setupGameRoom();

function createCampaign(shipCount = 1, seed = 1) {
    const state = rooms.createState(seededRandom(seed));
    return { state, ...startCampaign(state, shipCount) };
}

/** Meets whatever objective the running encounter has. */
function completeEncounter(state: GameState) {
    const encounter = state.campaign!.activeEncounter!;

    switch (encounter.node.objective?.type) {
        case 'boss':
            state.getObjectByScenarioId('boss')!.destroy();
            break;
        case 'destroyAll':
            for (const hostile of getHostileShips(state)) {
                hostile.destroy();
            }
            break;
        case 'survive':
            state.currentTime += encounter.objectiveEndTime;
            state.campaign!.tick(0);
            break;
        default:
            break;
    }

    expect(state.encounter!.objectiveMet).toBe(true);
}

/** Dismisses the intro, then flies the first available route to the boss. Leaves the game at the sector outro. */
function playSector(state: GameState, ship: PlayerShip) {
    const campaign = state.campaign!;
    expect(state.phase).toBe('sectorIntro');
    expect(campaign.dismissMessage()).toBe(true);

    while (state.phase === 'map') {
        expect(campaign.selectRoute(ship, state.map!.availableNodeIds[0])).toBe(true);
        expect(state.phase).toBe('encounter');
        completeEncounter(state);
        expect(campaign.warpAway(ship)).toBe(true);
    }

    expect(state.phase).toBe('sectorOutro');
}

function handIds(hand: Iterable<{ id: number }>) {
    return [...hand].map(card => card.id);
}

describe('Campaign phase flow', () => {
    it('starts in the first sector intro, with game time stopped', () => {
        const { state, campaign } = createCampaign();

        expect(state.phase).toBe('sectorIntro');
        expect(state.outcome).toBeNull();
        expect(state.message).toMatchObject({ kind: 'intro', title: sectorThemes[0].name });
        expect(state.map!.sectorIndex).toBe(0);
        expect(state.map!.sectorCount).toBe(3);
        expect(state.map!.currentNodeId).toBe(state.map!.startNodeId);
        expect([...state.map!.visitedNodeIds]).toEqual([state.map!.startNodeId]);
        expect([...state.map!.availableNodeIds]).toEqual([...state.map!.getNode(state.map!.startNodeId)!.next]);
        expect(state.encounter).toBeNull();
        expect(campaign.isInEncounter).toBe(false);
    });

    it('only a message dismissal advances out of the intro', () => {
        const { state, campaign, ships } = createCampaign();
        const nodeId = state.map!.availableNodeIds[0];

        expect(campaign.selectRoute(ships[0], nodeId)).toBe(false);
        expect(campaign.warpAway(ships[0])).toBe(false);
        expect(state.phase).toBe('sectorIntro');

        expect(campaign.dismissMessage()).toBe(true);
        expect(state.phase).toBe('map');
        expect(state.message).toBeNull();
        expect(campaign.dismissMessage()).toBe(false);
    });

    it('offers each of the next nodes as a helm route card and a science long range sensor reading', () => {
        const { state, campaign, ships } = createCampaign();
        campaign.dismissMessage();

        const available = [...state.map!.availableNodeIds];
        const [ship] = ships;

        const helmCards = [...ship.helmState.nonEncounterCards];
        expect(helmCards).toHaveLength(available.length);

        for (const card of helmCards) {
            expect(card.kind).toBe('route');
            expect(available).toContain(card.route!.nodeId);
        }

        const destinations = [...ship.scienceState.destinations];
        expect(destinations.map(destination => destination.id).sort()).toEqual([...available].sort());
        for (const destination of destinations) {
            const node = state.map!.getNode(destination.id)!;
            expect(destination).toMatchObject({ kind: node.kind, name: node.name, environment: node.environment, factionId: node.factionId });
        }

        expect(ship.scienceState.nonEncounterCards).toHaveLength(0);
        expect(ship.tacticalState.nonEncounterCards).toHaveLength(0);
        expect(ship.engineerState.nonEncounterCards).toHaveLength(0);
        expect(helmCards.map(card => card.route!.nodeId).sort()).toEqual([...available].sort());
    });

    it('rejects route selections that are not currently available', () => {
        const { state, campaign, ships } = createCampaign();
        campaign.dismissMessage();

        const available = new Set(state.map!.availableNodeIds);
        const unavailable = state.map!.nodes.find(node => !available.has(node.id))!;

        expect(campaign.selectRoute(ships[0], unavailable.id)).toBe(false);
        expect(campaign.selectRoute(ships[0], 'nope')).toBe(false);
        expect(state.phase).toBe('map');
        expect(state.map!.currentNodeId).toBe(state.map!.startNodeId);
    });

    it('stops ship systems on the map, and starts them again in the encounter', () => {
        const { state, campaign, ships } = createCampaign();
        const [ship] = ships;
        campaign.dismissMessage();

        const startTime = state.currentTime;
        const hand = handIds(ship.helmState.hand);
        const deck = handIds(ship.helmState.deck);

        // Time on the map neither draws nor discards.
        for (let i = 0; i < 12; i++) {
            state.tick(5000);
        }

        expect(state.currentTime).toBeGreaterThan(startTime);
        expect(handIds(ship.helmState.hand)).toEqual(hand);
        expect(handIds(ship.helmState.deck)).toEqual(deck);

        campaign.selectRoute(ship, state.map!.availableNodeIds[0]);
        expect(ship.helmState.nonEncounterCards).toHaveLength(0);
        expect(ship.scienceState.destinations).toHaveLength(0);

        // The first encounter tick has a normal delta, and the reactor starts a fresh draw cycle from now.
        expect(ship.helmState.hand.length).toBeGreaterThan(0);
    });

    it('only runs crew card generation timers during an encounter', () => {
        const { state, campaign, ships } = createCampaign();
        const [ship] = ships;
        const crewSystems = [ship.helmState, ship.scienceState, ship.tacticalState, ship.engineerState];
        const timers = () => crewSystems.map(system => system.cardGeneration);

        expect(timers()).toEqual([null, null, null, null]);
        campaign.dismissMessage();
        state.tick(5000);
        expect(timers()).toEqual([null, null, null, null]);

        campaign.selectRoute(ship, state.map!.availableNodeIds[0]);
        expect(timers().some(timer => timer !== null)).toBe(true);

        completeEncounter(state);
        campaign.warpAway(ship);
        expect(state.phase).toBe('map');
        expect(timers()).toEqual([null, null, null, null]);
        expect(ship.engineerState.systems.some(tile => tile.generating)).toBe(false);
    });

    it('selecting a route starts the encounter and narrows the next choices', () => {
        const { state, campaign, ships } = createCampaign();
        campaign.dismissMessage();

        const nodeId = state.map!.availableNodeIds[0];
        const node = state.map!.getNode(nodeId)!;
        expect(campaign.selectRoute(ships[0], nodeId)).toBe(true);

        expect(state.phase).toBe('encounter');
        expect(state.map!.currentNodeId).toBe(nodeId);
        expect([...state.map!.visitedNodeIds]).toEqual([state.map!.startNodeId, nodeId]);
        expect([...state.map!.availableNodeIds]).toEqual([...node.next]);
        expect(state.encounter).toMatchObject({ encounterId: node.encounterId, name: node.name, objectiveMet: false });

        // The route choice is final, and cannot be repeated.
        expect(campaign.selectRoute(ships[0], node.next[0])).toBe(false);
        expect(state.map!.currentNodeId).toBe(nodeId);
    });

    it('offers Warp Away only once the objective is met, and it returns to the map', () => {
        const { state, campaign, ships } = createCampaign();
        const [ship] = ships;
        campaign.dismissMessage();
        campaign.selectRoute(ship, state.map!.availableNodeIds[0]);

        const objectiveKind = state.campaign!.activeEncounter!.node.objective?.type;
        expect(objectiveKind).toBeDefined();
        const hasWarpCard = () => ship.helmState.hand.some(card => card.type === 'warpAway');

        expect(hasWarpCard()).toBe(false);
        expect(campaign.warpAway(ship)).toBe(false);
        expect(state.phase).toBe('encounter');

        completeEncounter(state);
        expect(hasWarpCard()).toBe(true);
        expect(ship.scienceState.hand.some(card => card.type === 'warpAway')).toBe(false);

        const currentNodeId = state.map!.currentNodeId;
        const next = [...state.map!.getNode(currentNodeId!)!.next];
        expect(campaign.warpAway(ship)).toBe(true);

        expect(state.phase).toBe('map');
        expect(state.encounter).toBeNull();
        expect(hasWarpCard()).toBe(false);
        expect(campaign.isInEncounter).toBe(false);
        expect([...state.objects.values()].every(object => object instanceof PlayerShip)).toBe(true);
        expect([...state.map!.availableNodeIds]).toEqual(next);
        expect(handIds(ship.helmState.nonEncounterCards)).toHaveLength(next.length);
        expect(campaign.warpAway(ship)).toBe(false);
    });

    it('ignores warp attempts from a ship that was not given the card', () => {
        const { state, campaign, ships } = createCampaign(2);
        campaign.dismissMessage();
        campaign.selectRoute(ships[0], state.map!.availableNodeIds[0]);
        completeEncounter(state);

        const stranger = new PlayerShip(state, playerShipSetup);
        expect(campaign.warpAway(stranger)).toBe(false);
        expect(state.phase).toBe('encounter');
    });

    it('playing a helm route card starts that encounter', () => {
        const { state, campaign, ships } = createCampaign();
        const [ship] = ships;
        campaign.dismissMessage();

        const routeCard = ship.helmState.nonEncounterCards[0];
        const { nodeId } = routeCard.route!;
        expect(campaign.selectRoute(ship, nodeId)).toBe(true);

        expect(state.phase).toBe('encounter');
        expect(state.map!.currentNodeId).toBe(nodeId);
        expect(ship.helmState.nonEncounterCards).toHaveLength(0);
    });

    it('runs through all three sectors to victory', () => {
        const { state, campaign, ships } = createCampaign();
        const mapIds: string[] = [];

        for (let sector = 0; sector < sectorThemes.length; sector++) {
            expect(state.map!.sectorIndex).toBe(sector);
            mapIds.push(state.map!.sectorId);
            playSector(state, ships[0]);

            expect(state.message).toMatchObject({ kind: 'outro', title: sectorThemes[sector].name });
            expect(state.map!.currentNodeId).toBe(state.map!.bossNodeId);
            expect(state.gameStatus).not.toBe('ended');

            // Only a dismissal moves on from an outro.
            expect(campaign.selectRoute(ships[0], 'x')).toBe(false);
            expect(campaign.warpAway(ships[0])).toBe(false);
            expect(state.phase).toBe('sectorOutro');

            expect(campaign.dismissMessage()).toBe(true);
            if (sector < sectorThemes.length - 1) {
                expect(state.phase).toBe('sectorIntro');
                expect(state.message).toMatchObject({ kind: 'intro', title: sectorThemes[sector + 1].name });
            }
        }

        expect(new Set(mapIds).size).toBe(3);
        expect(state.outcome).toBe('victory');
        expect(state.gameStatus).toBe('ended');
        expect(state.message).toBeNull();
        expect(campaign.dismissMessage()).toBe(false);
    });

    it('starts every encounter already complete, with nothing spawned, when dev auto win is on', () => {
        const { state, campaign, ships } = createCampaign();
        const [ship] = ships;
        state.devAutoWin = true;
        campaign.dismissMessage();

        while (state.phase === 'map') {
            expect(campaign.selectRoute(ship, state.map!.availableNodeIds[0])).toBe(true);
            expect(state.encounter!.objectiveMet).toBe(true);
            expect(state.encounter!.objectiveEndTime).toBe(0);
            expect([...state.objects.values()].every(object => object instanceof PlayerShip)).toBe(true);
            expect(ship.helmState.hand.some(card => card.type === 'warpAway')).toBe(true);
            expect(campaign.warpAway(ship)).toBe(true);
        }

        expect(state.phase).toBe('sectorOutro');
    });

    it('is defeated when the last player ship is destroyed', () => {
        const { state, campaign, ships } = createCampaign();
        campaign.dismissMessage();
        campaign.selectRoute(ships[0], state.map!.availableNodeIds[0]);

        ships[0].destroy();

        expect(state.outcome).toBe('defeat');
        expect(state.gameStatus).toBe('ended');
        expect(state.message).toMatchObject({ kind: 'defeat', text: sectorThemes[0].defeatMessage });
        expect(state.encounter).toBeNull();
        expect(campaign.selectRoute(ships[0], 'x')).toBe(false);
    });

    it('keeps playing while at least one player ship survives', () => {
        const { state, campaign, ships } = createCampaign(2);
        campaign.dismissMessage();
        campaign.selectRoute(ships[0], state.map!.availableNodeIds[0]);

        ships[1].destroy();
        expect(state.phase).toBe('encounter');
        expect(state.outcome).toBeNull();

        ships[0].destroy();
        expect(state.gameStatus).toBe('ended');
        expect(state.outcome).toBe('defeat');
    });
});

describe('Campaign scene changes', () => {
    /** Wait out a short scene change delay, then let the room's clock run the scheduled change. */
    async function finishSceneChange() {
        await new Promise(resolve => setTimeout(resolve, 40));
        rooms.getClock().tick();
    }

    it('fades out before travelling from the map to an encounter, ignoring further routes meanwhile', async () => {
        const { state, campaign, ships: [ship] } = createCampaign();
        campaign.dismissMessage();
        state.sceneChangeDelay = 20;

        const [first, second] = state.map!.availableNodeIds;
        expect(campaign.selectRoute(ship, first)).toBe(true);
        expect(state.sceneChange).toBe('travel');
        expect(state.phase).toBe('map');
        expect(campaign.selectRoute(ship, second ?? first)).toBe(false);

        await finishSceneChange();

        expect(state.sceneChange).toBeNull();
        expect(state.phase).toBe('encounter');
        expect(state.map!.currentNodeId).toBe(first);
    });

    it('fades out before warping away from a completed encounter', async () => {
        const { state, campaign, ships: [ship] } = createCampaign();
        campaign.dismissMessage();
        campaign.selectRoute(ship, state.map!.availableNodeIds[0]);
        completeEncounter(state);
        state.sceneChangeDelay = 20;

        expect(campaign.warpAway(ship)).toBe(true);
        expect(state.sceneChange).toBe('travel');
        expect(state.phase).toBe('encounter');

        await finishSceneChange();

        expect(state.sceneChange).toBeNull();
        expect(state.phase).toBe('map');
    });
});

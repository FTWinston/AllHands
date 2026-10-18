import { seededRandom, setupGameRoom, startCampaign } from 'src/testUtils';
import { getHostileShips } from 'src/utils/shipQueries';
import { describe, expect, it } from 'vitest';
import { getDefaultNode, getDevEncounterList, getEncounterIds } from './EncounterRegistry';
import { RepairStationEncounter } from './RepairStationEncounter';
import { defaultSurviveDurationMs } from './SurviveEncounter';
import type { Ship } from 'src/state/Ship';

const rooms = setupGameRoom();

function createCampaign(shipCount = 1) {
    const state = rooms.createState(seededRandom(3));
    return { state, ...startCampaign(state, shipCount) };
}

function hasWarpCard(ship: Ship) {
    return ship.helmState.hand.some(card => card.type === 'warpAway');
}

function systemsOf(ship: Ship) {
    return [ship.hullState, ship.reactorState, ship.helmState, ship.scienceState, ship.tacticalState, ship.engineerState];
}

function totalHealth(ship: Ship) {
    return systemsOf(ship).reduce((sum, system) => sum + system.health, 0);
}

function totalMaxHealth(ship: Ship) {
    return systemsOf(ship).reduce((sum, system) => sum + system.maxHealth, 0);
}

describe('encounter registry', () => {
    it('registers the expected encounters', () => {
        expect(getEncounterIds().sort()).toEqual([
            'ambush', 'assault', 'bossA', 'bossB', 'bossC', 'escort', 'repairStation', 'skirmish', 'survive',
        ]);
        expect(getDevEncounterList().map(info => info.id)).toEqual(getEncounterIds());
    });
});

describe('devLoadEncounter', () => {
    it.each(getEncounterIds())('starts %s standalone', (encounterId) => {
        const { state, campaign, ships } = createCampaign();

        expect(campaign.devLoadEncounter(encounterId)).toBe(true);
        expect(state.phase).toBe('encounter');
        expect(state.encounter!.encounterId).toBe(encounterId);
        expect(campaign.isInEncounter).toBe(true);

        const hostiles = getHostileShips(state);
        if (encounterId === 'repairStation') {
            expect(hostiles).toHaveLength(0);
            expect(state.encounter!.objectiveMet).toBe(true);
            expect(hasWarpCard(ships[0])).toBe(true);
        } else {
            expect(hostiles.length).toBeGreaterThan(0);
            expect(state.encounter!.objectiveMet).toBe(false);
        }

        // The dev encounter can be left again, back to the map of the sector that was running.
        if (encounterId === 'repairStation') {
            expect(campaign.warpAway(ships[0])).toBe(true);
            expect(state.phase).toBe('map');
        }
    });

    it('replaces a running encounter and can be repeated', () => {
        const { state, campaign, ships } = createCampaign();
        campaign.dismissMessage();
        campaign.selectRoute(ships[0], state.map!.availableNodeIds[0]);

        expect(campaign.devLoadEncounter('ambush')).toBe(true);
        expect(getHostileShips(state)).toHaveLength(3);
        expect(campaign.devLoadEncounter('ambush')).toBe(true);
        expect(getHostileShips(state)).toHaveLength(3);
        expect(state.objects.size).toBe(ships.length + 3);
    });

    it('rejects unknown encounters', () => {
        const { state, campaign } = createCampaign();

        expect(campaign.devLoadEncounter('nonsense' as never)).toBe(false);
        expect(state.phase).toBe('sectorIntro');
    });

    it('clears the route cards and destinations when loaded from the map', () => {
        const { state, campaign, ships } = createCampaign();
        campaign.dismissMessage();
        expect(ships[0].helmState.nonEncounterCards.length).toBeGreaterThan(0);
        expect(ships[0].scienceState.destinations.length).toBeGreaterThan(0);

        campaign.devLoadEncounter('skirmish');

        expect(ships[0].helmState.nonEncounterCards).toHaveLength(0);
        expect(ships[0].scienceState.destinations).toHaveLength(0);
        expect(state.phase).toBe('encounter');
    });

    it('does not end the game when the last hostile is destroyed in a dev encounter, and warp returns to the map', () => {
        const { state, campaign, ships } = createCampaign();
        campaign.devLoadEncounter('skirmish');

        for (const hostile of getHostileShips(state)) {
            hostile.destroy();
        }

        expect(state.encounter!.objectiveMet).toBe(true);
        expect(campaign.warpAway(ships[0])).toBe(true);
        expect(state.phase).toBe('map');
    });
});

describe('objectives', () => {
    it('destroyAll completes only when every hostile is gone', () => {
        const { state, campaign, ships } = createCampaign();
        campaign.devLoadEncounter('skirmish');

        const [first, ...rest] = getHostileShips(state);
        expect(rest.length).toBeGreaterThan(0);

        first.destroy();
        expect(state.encounter!.objectiveMet).toBe(false);
        expect(hasWarpCard(ships[0])).toBe(false);

        for (const hostile of rest) {
            hostile.destroy();
        }

        expect(state.encounter!.objectiveMet).toBe(true);
        expect(hasWarpCard(ships[0])).toBe(true);
    });

    it('survive completes at the end of its timer even with hostiles alive', () => {
        const { state, campaign, ships } = createCampaign();
        campaign.devLoadEncounter('survive');

        expect(state.encounter!.objective).toMatchObject({ type: 'survive' });
        expect(state.encounter!.objectiveEndTime).toBe(state.currentTime + defaultSurviveDurationMs);

        state.currentTime += defaultSurviveDurationMs - 1;
        campaign.tick(0);
        expect(state.encounter!.objectiveMet).toBe(false);
        expect(hasWarpCard(ships[0])).toBe(false);

        state.currentTime += 1;
        campaign.tick(0);
        expect(state.encounter!.objectiveMet).toBe(true);
        expect(hasWarpCard(ships[0])).toBe(true);
        expect(getHostileShips(state).length).toBeGreaterThan(0);

        expect(campaign.warpAway(ships[0])).toBe(true);
        expect(getHostileShips(state)).toHaveLength(0);
    });

    it.each(['bossA', 'bossB', 'bossC'] as const)('%s completes when the boss dies, even with escorts alive', (encounterId) => {
        const { state, campaign, ships } = createCampaign();
        campaign.devLoadEncounter(encounterId);

        const boss = state.getObjectByScenarioId('boss')!;
        const escorts = getHostileShips(state).filter(ship => ship !== boss);
        expect(boss).toBeDefined();
        expect(escorts.length).toBeGreaterThan(0);
        expect(state.encounter!.objectiveMet).toBe(false);

        // Killing escorts alone does not finish it.
        escorts[0].destroy();
        expect(state.encounter!.objectiveMet).toBe(false);

        boss.destroy();
        expect(state.encounter!.objectiveMet).toBe(true);
        expect(hasWarpCard(ships[0])).toBe(true);
        expect(getHostileShips(state).length).toBeGreaterThan(0);
    });
});

describe('RepairStationEncounter', () => {
    it('fully repairs every player ship when it starts', () => {
        const { state, ships } = createCampaign(2);

        for (const ship of ships) {
            for (const system of [ship.hullState, ship.helmState, ship.tacticalState]) {
                system.adjustHealth(-2);
            }
        }

        for (const ship of ships) {
            expect(totalHealth(ship)).toBeLessThan(totalMaxHealth(ship));
        }

        new RepairStationEncounter(state, getDefaultNode('repairStation')).start();

        for (const ship of ships) {
            expect(totalHealth(ship)).toBe(totalMaxHealth(ship));
        }
    });

    it('has no objective and is complete once started', () => {
        const { state } = createCampaign();
        const encounter = new RepairStationEncounter(state, getDefaultNode('repairStation'));
        let completions = 0;
        encounter.onComplete.addListener('test', () => completions++);

        expect(encounter.isComplete).toBe(false);
        encounter.start();

        expect(encounter.isComplete).toBe(true);
        expect(completions).toBe(1);
        expect(encounter.node.objective).toBeUndefined();
    });

    it('is reached through the campaign, after damage that persisted from the previous fight', () => {
        const { state, campaign, ships } = createCampaign();
        campaign.devLoadEncounter('skirmish');
        ships[0].hullState.adjustHealth(-3);
        for (const hostile of getHostileShips(state)) {
            hostile.destroy();
        }

        campaign.warpAway(ships[0]);
        expect(totalHealth(ships[0])).toBeLessThan(totalMaxHealth(ships[0]));

        campaign.devLoadEncounter('repairStation');
        expect(totalHealth(ships[0])).toBe(totalMaxHealth(ships[0]));
    });
});

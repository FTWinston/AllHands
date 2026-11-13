import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { antimatterRewards } from 'common-data/features/ships/utils/antimatter';
import { playerFactionId } from 'src/campaign/factions';
import { HailState } from 'src/state/HailState';
import { ObjectiveState } from 'src/state/ObjectiveState';
import { seededRandom, setupGameRoom, startCampaign } from 'src/testUtils';
import { getHostileShips } from 'src/utils/shipQueries';
import { describe, expect, it, vi } from 'vitest';
import { createEncounter, getDefaultNode, getDevEncounterList, getEncounterDefinition, getEncounterIds, getNodeName, stationEncounterIds } from './EncounterRegistry';
import { StationEncounter } from './StationEncounter';
import { defaultSurviveDurationMs } from './SurviveEncounter';
import type { Campaign } from 'src/campaign/Campaign';
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
            'ambush', 'armsDealer', 'assault', 'bossA', 'bossB', 'bossC', 'escort', 'feverShip', 'navigationBeacon', 'repairStation', 'researchOutpost', 'salvageYard', 'skirmish', 'slowBoat', 'standingOrders', 'survive', 'tollCollectors',
        ]);
        expect(getDevEncounterList().map(info => info.id)).toEqual(getEncounterIds());
    });

    it('offers the elite form of every request, and of nothing else', () => {
        const withElite = getDevEncounterList().filter(info => info.hasElite).map(info => info.id);

        expect(withElite).toEqual(getEncounterIds().filter(id => getEncounterDefinition(id).kind === 'combat'));
        expect(withElite).toContain('slowBoat');
        expect(getDefaultNode('slowBoat', true).elite).toBe(true);
        expect(getDefaultNode('repairStation', true).elite).toBeUndefined();
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
        if (Object.values(stationEncounterIds).includes(encounterId)) {
            expect(hostiles).toHaveLength(0);
            expect(state.encounter!.outcome).toBe('success');
            expect(hasWarpCard(ships[0])).toBe(true);
        } else {
            expect(hostiles.length).toBeGreaterThan(0);
            expect(state.encounter!.outcome).toBeNull();
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

    it('starts the elite form when asked for it', () => {
        const { state, campaign } = createCampaign();

        expect(campaign.devLoadEncounter('ambush', true)).toBe(true);
        expect(getHostileShips(state)).toHaveLength(4);

        expect(campaign.devLoadEncounter('ambush')).toBe(true);
        expect(getHostileShips(state)).toHaveLength(3);
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

        expect(state.encounter!.outcome).toBe('success');
        expect(campaign.warpAway(ships[0])).toBe(true);
        expect(state.phase).toBe('map');
    });
});

describe('objectives', () => {
    it('clear completes only when every hostile is gone', () => {
        const { state, campaign, ships } = createCampaign();
        campaign.devLoadEncounter('skirmish');

        const [first, ...rest] = getHostileShips(state);
        expect(rest.length).toBeGreaterThan(0);

        first.destroy();
        expect(state.encounter!.outcome).toBeNull();
        expect(hasWarpCard(ships[0])).toBe(false);

        for (const hostile of rest) {
            hostile.destroy();
        }

        expect(state.encounter!.outcome).toBe('success');
        expect(hasWarpCard(ships[0])).toBe(true);
    });

    it('survive completes at the end of its timer even with hostiles alive', () => {
        const { state, campaign, ships } = createCampaign();
        campaign.devLoadEncounter('survive');

        expect(state.encounter!.objective).toMatchObject({ type: 'survive' });
        expect(state.encounter!.objectiveEndTime).toBe(state.currentTime + defaultSurviveDurationMs);

        state.currentTime += defaultSurviveDurationMs - 1;
        campaign.tick(0);
        expect(state.encounter!.outcome).toBeNull();
        expect(hasWarpCard(ships[0])).toBe(false);

        state.currentTime += 1;
        campaign.tick(0);
        expect(state.encounter!.outcome).toBe('success');
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
        expect(state.encounter!.outcome).toBeNull();

        // Killing escorts alone does not finish it.
        escorts[0].destroy();
        expect(state.encounter!.outcome).toBeNull();

        boss.destroy();
        expect(state.encounter!.outcome).toBe('success');
        expect(hasWarpCard(ships[0])).toBe(true);
        expect(getHostileShips(state).length).toBeGreaterThan(0);
    });
});

describe('outcomes', () => {
    /** Ends the running encounter as its own rules would, with the given outcome. */
    function conclude(campaign: Campaign, ...outcome: ['success' | 'failure', number?]) {
        (campaign.activeEncounter as unknown as { complete(...args: typeof outcome): void }).complete(...outcome);
    }

    it('a failed objective pays nothing, but the crew can still leave and carry on', () => {
        const { state, campaign, ships } = createCampaign();
        campaign.devLoadEncounter('skirmish');

        conclude(campaign, 'failure');

        expect(campaign.activeEncounter!.outcome).toBe('failure');
        expect(state.encounter!.outcome).toBe('failure');
        expect(ships[0].antimatter).toBe(0);
        expect(state.gameStatus).not.toBe('ended');
        expect(getHostileShips(state).length).toBeGreaterThan(0);

        expect(hasWarpCard(ships[0])).toBe(true);
        expect(campaign.warpAway(ships[0])).toBe(true);
        expect(state.phase).toBe('map');
    });

    it('a met objective pays in full', () => {
        const { campaign, ships } = createCampaign();
        campaign.devLoadEncounter('skirmish');

        conclude(campaign, 'success');

        expect(campaign.activeEncounter!.score).toBe(1);
        expect(ships[0].antimatter).toBe(antimatterRewards.combat);
    });

    it('a graded success pays in proportion to its score', () => {
        const { campaign, ships } = createCampaign();
        campaign.devLoadEncounter('skirmish');

        conclude(campaign, 'success', 0.5);

        expect(ships[0].antimatter).toBe(antimatterRewards.combat / 2);
    });

    it('an outcome is final', () => {
        const { state, campaign, ships } = createCampaign();
        campaign.devLoadEncounter('skirmish');

        conclude(campaign, 'failure');
        conclude(campaign, 'success');

        expect(state.encounter!.outcome).toBe('failure');
        expect(ships[0].antimatter).toBe(0);
    });
});

describe('what the viewscreen is told', () => {
    it('is the objective while the encounter runs, then how it ended, then nothing once the crew has left', () => {
        const { state, campaign, ships } = createCampaign();
        expect(state.objective).toBeNull();

        campaign.devLoadEncounter('skirmish');
        expect(state.objective).toMatchObject({ type: 'clear' });
        expect(state.encounterOutcome).toBeNull();

        for (const hostile of getHostileShips(state)) {
            hostile.destroy();
        }
        expect(state.objective).toMatchObject({ type: 'clear' });
        expect(state.encounterOutcome).toBe('success');

        campaign.warpAway(ships[0]);
        expect(state.objective).toBeNull();
        expect(state.encounterOutcome).toBeNull();
    });

    it('includes a failure', () => {
        const { state, campaign } = createCampaign();
        campaign.devLoadEncounter('skirmish');

        (campaign.activeEncounter as unknown as { complete(outcome: 'failure'): void }).complete('failure');

        expect(state.encounterOutcome).toBe('failure');
    });

    it('carries how long there is to survive, and who or what an objective is about', () => {
        const { state, campaign } = createCampaign();

        campaign.devLoadEncounter('survive');
        expect(state.objective).toMatchObject({ type: 'survive', durationMs: defaultSurviveDurationMs, subject: '' });

        expect(new ObjectiveState({ type: 'protect', subject: 'Marrow' })).toMatchObject({ type: 'protect', durationMs: 0, subject: 'Marrow' });
    });

    it('has no objective at a station', () => {
        const { state, campaign } = createCampaign();
        campaign.devLoadEncounter('repairStation');

        expect(state.objective).toBeNull();
        expect(state.encounterOutcome).toBe('success');
    });

    it('forgets whatever was being said once the crew has left', () => {
        const { state, campaign, ships } = createCampaign();
        campaign.devLoadEncounter('skirmish');
        state.hail = new HailState({ speaker: 'Someone', text: 'Something.' });

        for (const hostile of getHostileShips(state)) {
            hostile.destroy();
        }
        expect(state.hail).not.toBeNull();

        campaign.warpAway(ships[0]);
        expect(state.hail).toBeNull();
    });
});

describe('requests', () => {
    it('name a node after who is calling and what about, and give it what they said', () => {
        const node = getDefaultNode('tollCollectors');
        const definition = getEncounterDefinition('tollCollectors');

        expect(definition.request).toBeDefined();
        expect(getNodeName(definition, 'Encounter B2')).toBe('Hauler Local 12: toll dispute');
        expect(node.request).toBe(definition.request!.text);
    });

    it('leave an encounter that nobody called about with its usual name, and nothing said', () => {
        const definition = getEncounterDefinition('skirmish');

        expect(getNodeName(definition, 'Encounter B2')).toBe('Encounter B2');
        expect(getDefaultNode('skirmish').request).toBeUndefined();
    });

    it('are never made about stations', () => {
        for (const encounterId of Object.values(stationEncounterIds)) {
            expect(getEncounterDefinition(encounterId).request).toBeUndefined();
        }
    });
});

describe('warping away', () => {
    it('shows the player ship jumping to warp from where it is, as it leaves a fight', () => {
        const { state, campaign, ships } = createCampaign();
        campaign.devLoadEncounter('skirmish');
        for (const hostile of getHostileShips(state)) {
            hostile.destroy();
        }

        const effects = vi.spyOn(state, 'broadcastWeaponEffect');
        expect(campaign.warpAway(ships[0])).toBe(true);

        expect(effects).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
            type: 'warpAway',
            sourceId: ships[0].id,
            appearance: ships[0].appearance,
            position: ships[0].getPosition(state.currentTime),
        }));
    });

    it('shows nothing when leaving a station, as there is no space view there', () => {
        const { state, campaign, ships } = createCampaign();
        campaign.devLoadEncounter('repairStation');

        const effects = vi.spyOn(state, 'broadcastWeaponEffect');
        expect(campaign.warpAway(ships[0])).toBe(true);

        expect(effects).not.toHaveBeenCalled();
    });

    it('shows nothing when the card is refused', () => {
        const { state, campaign, ships } = createCampaign();
        campaign.devLoadEncounter('skirmish');

        const effects = vi.spyOn(state, 'broadcastWeaponEffect');
        expect(campaign.warpAway(ships[0])).toBe(false);

        expect(effects).not.toHaveBeenCalled();
    });
});

describe('encounter factions', () => {
    it('exist only for as long as the encounter does', () => {
        const { state, campaign, ships } = createCampaign();
        const playerRelations = state.factions.get(playerFactionId)!.relations;
        expect(playerRelations.size).toBe(0);

        campaign.devLoadEncounter('skirmish');
        expect(playerRelations.size).toBe(1);

        for (const hostile of getHostileShips(state)) {
            hostile.destroy();
        }
        campaign.warpAway(ships[0]);

        expect(playerRelations.size).toBe(0);
        expect([...state.factions.keys()]).toEqual([playerFactionId]);
    });
});

describe('StationEncounter', () => {
    it.each(Object.values(stationEncounterIds))('%s fully repairs every player ship when it starts', (encounterId) => {
        const { state, ships } = createCampaign(2);

        for (const ship of ships) {
            for (const system of [ship.hullState, ship.helmState, ship.tacticalState]) {
                system.adjustHealth(-2);
            }
        }

        for (const ship of ships) {
            expect(totalHealth(ship)).toBeLessThan(totalMaxHealth(ship));
        }

        new StationEncounter(state, getDefaultNode(encounterId)).start();

        for (const ship of ships) {
            expect(totalHealth(ship)).toBe(totalMaxHealth(ship));
        }
    });

    it('has no objective and is complete once started', () => {
        const { state } = createCampaign();
        const encounter = new StationEncounter(state, getDefaultNode('repairStation'));
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

        // Damage to stabilised cards is critical, so lasts beyond the fight.
        for (const card of ships[0].hullState.deck) {
            card.addTrait('stabilised', ExtraTraitType.Normal);
        }
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

describe('elite encounters', () => {
    it.each(['skirmish', 'ambush', 'assault', 'escort', 'survive'])('%s brings an extra heavy cruiser when elite', (encounterId) => {
        const { state } = createCampaign();
        const spawnHostiles = (elite: boolean) => {
            for (const ship of getHostileShips(state)) {
                state.remove(ship);
            }

            createEncounter(state, { ...getDefaultNode(encounterId), elite }).start();
            return getHostileShips(state).map(ship => ship.name);
        };

        const regular = spawnHostiles(false);
        const elite = spawnHostiles(true);

        expect(elite).toHaveLength(regular.length + 1);
        expect(elite.filter(name => name.endsWith('Heavy Cruiser'))).toHaveLength(regular.filter(name => name.endsWith('Heavy Cruiser')).length + 1);
    });
});

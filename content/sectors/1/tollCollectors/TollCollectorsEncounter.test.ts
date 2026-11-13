import { getHailDuration } from 'common-data/features/sectors/types/HailInfo';
import { antimatterRewards } from 'common-data/features/ships/utils/antimatter';
import { listenToHails, seededRandom, setupGameRoom, startCampaign } from 'engine/testUtils';
import { getHostileShips } from 'engine/utils/shipQueries';
import { describe, expect, it, vi } from 'vitest';
import { eliteReinforcementMs, tollCruiserScenarioId } from './TollCollectorsEncounter.engine';
import type { AiShip } from 'engine/state/AiShip';
import type { GameState } from 'engine/state/GameState';
import type { HullSystemTile } from 'engine/state/systems/engineer/HullSystemTile';

const rooms = setupGameRoom();

/** A campaign running Toll Collectors, with its cruiser and escorts picked out. */
function createTollCollectors(elite = false) {
    const state = rooms.createState(seededRandom(3));
    const { campaign, ships } = startCampaign(state);
    campaign.devLoadEncounter('tollCollectors', elite);

    return { state, campaign, ships, ...findWardens(state) };
}

/** Lets the cruiser's opening demand be read, so whatever's said next is said straight away. */
function hearOpening(state: GameState) {
    listenToHails(state, getHailDuration(state.hail!.text));
}

function findWardens(state: GameState) {
    const cruiser = state.getObjectByScenarioId(tollCruiserScenarioId) as AiShip;
    const escorts = getHostileShips(state).filter(ship => ship !== cruiser);
    return { cruiser, escorts };
}

function dropShields(ship: AiShip) {
    (ship.engineerState.systems.find(tile => tile.system === 'hull') as HullSystemTile).setShield(0);
}

/** Damages a ship's hull to a fifth of its health, then lets its commander react. Returns whether it ever chose to flee. */
function fleesWhenBadlyDamaged(state: GameState, ship: AiShip) {
    ship.hullState.adjustHealth(-Math.floor(ship.hullState.maxHealth * 0.8));

    // Its commander doesn't reassess the situation on every update, so give it plenty.
    for (let i = 0; i < 30; i++) {
        ship.ai.commander.update(ship.ai.blackboard, state.currentTime);
        if (ship.ai.blackboard.goal === 'flee') {
            return true;
        }
    }

    return false;
}

describe('TollCollectorsEncounter', () => {
    it('has a cruiser holding the jump point ahead of the player, with two escorts guarding it', () => {
        const { state, ships, cruiser, escorts } = createTollCollectors();

        expect(state.encounter!.objective).toEqual({ type: 'clear' });
        expect(escorts).toHaveLength(2);
        expect(getHostileShips(state).map(ship => ship.name).sort()).toEqual(['Escort One', 'Escort Two', 'Warden Cruiser Assize']);

        const playerPosition = ships[0].getPosition(state.currentTime);
        const cruiserPosition = cruiser.getPosition(state.currentTime);
        expect(cruiserPosition.x).toBeGreaterThan(playerPosition.x);
        expect(cruiserPosition.y).toBe(playerPosition.y);

        expect(cruiser.ai.blackboard.goal).toBe('defend-position');
        for (const escort of escorts) {
            expect(escort.ai.blackboard.goal).toBe('guard-ship');
        }
    });

    it('is cleared once all three are destroyed', () => {
        const { state, ships, cruiser, escorts } = createTollCollectors();

        escorts[0].destroy();
        escorts[1].destroy();
        expect(state.encounter!.outcome).toBeNull();

        cruiser.destroy();
        expect(state.encounter!.outcome).toBe('success');
        expect(ships[0].antimatter).toBe(antimatterRewards.combat);
    });

    it('is cleared just the same when they leave instead', () => {
        const { state, campaign, ships, cruiser, escorts } = createTollCollectors();
        const onObjectRemoved = vi.spyOn(campaign.activeEncounter!, 'objectRemoved');

        escorts[0].depart();
        expect(onObjectRemoved).toHaveBeenLastCalledWith(escorts[0], 'departed');

        cruiser.depart();
        escorts[1].depart();

        expect(state.encounter!.outcome).toBe('success');
        expect(ships[0].antimatter).toBe(antimatterRewards.combat);
    });

    it('the cruiser withdraws when its shields are knocked out, and takes its escorts with it', () => {
        const { campaign, cruiser, escorts } = createTollCollectors();

        campaign.tick(0);
        expect(cruiser.ai.commander.isWithdrawing).toBe(false);

        dropShields(cruiser);
        campaign.tick(0);

        expect(cruiser.ai.commander.isWithdrawing).toBe(true);
        expect(escorts.map(escort => escort.ai.commander.isWithdrawing)).toEqual([true, true]);
    });

    it('plays out to a success once the cruiser\'s shields are down, with nothing destroyed', () => {
        const { state, ships, cruiser } = createTollCollectors();
        const removed: string[] = [];
        vi.spyOn(state, 'remove').mockImplementation(function (this: GameState, object, reason = 'destroyed') {
            removed.push(`${object.name}: ${reason}`);
            return Object.getPrototypeOf(state).remove.call(state, object, reason);
        });

        dropShields(cruiser);

        // The whole game runs here, AI and all, with a player ship that does nothing. Its timers aren't otherwise running.
        const tick = 100;
        for (let elapsed = 0; elapsed < 120_000 && state.encounter!.outcome === null; elapsed += tick) {
            state.tick(tick);

            for (const delayed of [...rooms.getClock().delayed]) {
                if (delayed.active) {
                    delayed.tick(tick);
                }
            }
        }

        expect(state.encounter!.outcome).toBe('success');
        expect(removed.sort()).toEqual(['Escort One: departed', 'Escort Two: departed', 'Warden Cruiser Assize: departed']);
        expect(state.objects.has(ships[0].id)).toBe(true);
    });

    it('escorts flee when badly damaged, while the cruiser lives', () => {
        const { state, escorts } = createTollCollectors();

        expect(fleesWhenBadlyDamaged(state, escorts[0])).toBe(true);
    });

    it('escorts fight to the end if the cruiser is destroyed', () => {
        const { state, cruiser, escorts } = createTollCollectors();

        cruiser.destroy();

        expect(escorts.map(escort => escort.ai.commander.isWithdrawing)).toEqual([false, false]);
        expect(fleesWhenBadlyDamaged(state, escorts[0])).toBe(false);
        expect(state.encounter!.outcome).toBeNull();
    });

    it('escorts turn back and fight to the end if the cruiser is destroyed while it withdraws', () => {
        const { state, campaign, cruiser, escorts } = createTollCollectors();

        dropShields(cruiser);
        campaign.tick(0);
        expect(escorts.map(escort => escort.ai.commander.isWithdrawing)).toEqual([true, true]);
        escorts[0].ai.commander.update(escorts[0].ai.blackboard, state.currentTime);

        cruiser.destroy();

        expect(escorts.map(escort => escort.ai.commander.isWithdrawing)).toEqual([false, false]);

        // Its commander doesn't reassess the situation on every update, so give it plenty to come about.
        for (let i = 0; i < 30; i++) {
            escorts[0].ai.commander.update(escorts[0].ai.blackboard, state.currentTime);
        }
        expect(escorts[0].ai.blackboard.goal).toBe('search-and-destroy');

        expect(fleesWhenBadlyDamaged(state, escorts[0])).toBe(false);
        expect(state.encounter!.outcome).toBeNull();
    });

    it('an escort that has already left stays gone when the cruiser is destroyed', () => {
        const { state, campaign, cruiser, escorts } = createTollCollectors();

        dropShields(cruiser);
        campaign.tick(0);
        escorts[0].depart();
        cruiser.destroy();

        expect(getHostileShips(state)).toEqual([escorts[1]]);
        expect(escorts[1].ai.commander.isWithdrawing).toBe(false);
    });

    describe('hails', () => {
        it('opens with the cruiser demanding its toll', () => {
            const { state } = createTollCollectors();

            expect(state.hail).toMatchObject({ speaker: 'Warden Cruiser Assize' });
            expect(state.hail!.text).toContain('Transit duty');
        });

        it('has the cruiser say so when it withdraws', () => {
            const { state, campaign, cruiser } = createTollCollectors();
            hearOpening(state);

            dropShields(cruiser);
            campaign.tick(0);

            expect(state.hail).toMatchObject({ speaker: 'Warden Cruiser Assize', text: 'Cost exceeds mandate. Withdrawing.' });
        });

        it('has an escort swear revenge when the cruiser is destroyed', () => {
            const { state, cruiser, escorts } = createTollCollectors();
            hearOpening(state);

            cruiser.destroy();

            expect(state.hail).toMatchObject({ speaker: escorts[0].name, text: 'Assize is gone. No quarter.' });
        });

        it('ends with thanks from whoever asked for help, once everything else has been said', () => {
            const { state, cruiser, escorts } = createTollCollectors();

            dropShields(cruiser);
            listenToHails(state, 100);
            for (const ship of [...escorts, cruiser]) {
                ship.depart();
            }

            expect(listenToHails(state, 30_000).map(hail => hail.speaker)).toEqual(['Warden Cruiser Assize', 'Hauler Local 12']);
        });
    });

    it('never brings a second cruiser unless it is elite', () => {
        const { state, campaign } = createTollCollectors();

        state.currentTime += eliteReinforcementMs * 2;
        campaign.tick(0);

        expect(getHostileShips(state)).toHaveLength(3);
    });

    describe('elite', () => {
        function createElite() {
            const { state, campaign, cruiser, escorts } = createTollCollectors(true);

            /** Moves game time on, and has the encounter catch up. */
            const wait = (ms: number) => {
                state.currentTime += ms;
                campaign.tick(0);
            };

            return { state, wait, cruiser, escorts };
        }

        it('brings a second cruiser after a while, which hunts the player', () => {
            const { state, wait } = createElite();

            wait(eliteReinforcementMs - 1);
            expect(getHostileShips(state)).toHaveLength(3);

            wait(1);
            const hostiles = getHostileShips(state);
            expect(hostiles).toHaveLength(4);

            const second = hostiles.find(ship => ship.name === 'Warden Cruiser Tithe')!;
            expect(second.ai.blackboard.goal).toBe('search-and-destroy');
            expect(state.hail).toMatchObject({ speaker: 'Warden Cruiser Tithe' });

            // Only the one.
            wait(eliteReinforcementMs);
            expect(getHostileShips(state)).toHaveLength(4);
        });

        it('the second cruiser withdraws alone when its own shields are knocked out', () => {
            const { state, wait, cruiser, escorts } = createElite();

            wait(eliteReinforcementMs);
            const second = getHostileShips(state).find(ship => ship.name === 'Warden Cruiser Tithe')!;

            dropShields(second);
            wait(0);

            expect(second.ai.commander.isWithdrawing).toBe(true);
            expect(cruiser.ai.commander.isWithdrawing).toBe(false);
            expect(escorts.map(escort => escort.ai.commander.isWithdrawing)).toEqual([false, false]);
        });

        it('brings no second cruiser if the first has already withdrawn', () => {
            const { state, wait, cruiser } = createElite();

            dropShields(cruiser);
            wait(0);

            wait(eliteReinforcementMs);

            expect(getHostileShips(state)).toHaveLength(3);
        });

        it('brings no second cruiser if the first has already been destroyed', () => {
            const { state, wait, cruiser } = createElite();

            cruiser.destroy();

            wait(eliteReinforcementMs);

            expect(getHostileShips(state)).toHaveLength(2);
        });
    });
});

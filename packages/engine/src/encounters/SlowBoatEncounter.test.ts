import { antimatterRewards } from 'common-data/features/ships/utils/antimatter';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { MotionKeyframe } from 'src/state/MotionKeyframe';
import { seededRandom, setupGameRoom, startCampaign } from 'src/testUtils';
import { getHostileShips } from 'src/utils/shipQueries';
import { describe, expect, it } from 'vitest';
import { getDefaultNode } from './EncounterRegistry';
import { boughtCrossingScore, harrierIntervalMs, marrowScenarioId, maxHarriers, offerAnswers, offerAtMs, offerTimeoutMs } from './SlowBoatEncounter';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { Vector2D } from 'common-data/features/space/types/Vector2D';
import type { Campaign } from 'src/campaign/Campaign';
import type { AiShip } from 'src/state/AiShip';
import type { GameState } from 'src/state/GameState';
import type { PlayerShip } from 'src/state/PlayerShip';
import type { Ship } from 'src/state/Ship';
import type { HullSystemTile } from 'src/state/systems/engineer/HullSystemTile';

const rooms = setupGameRoom();

/** A campaign running Slow Boat, with the clinic ship and the harriers picked out. */
function createSlowBoat(seed = 3) {
    const state = rooms.createState(seededRandom(seed));
    const { campaign, ships } = startCampaign(state);
    campaign.devLoadEncounter('slowBoat');

    const marrow = state.getObjectByScenarioId(marrowScenarioId) as AiShip;
    const waypoints = (campaign.activeEncounter as unknown as { waypoints: Vector2D[] }).waypoints;

    return { state, campaign, ship: ships[0], marrow, waypoints, harriers: getHostileShips(state) };
}

function getHullTile(ship: Ship) {
    return ship.engineerState.systems.find(tile => tile.system === 'hull') as HullSystemTile;
}

/** Leaves the ship's shields at the given fraction of their capacity. */
function setShields(ship: Ship, fraction: number) {
    getHullTile(ship).setShield(ship.hullState.maxShield * fraction);
}

/** Puts the clinic ship at the given point, and lets its commander take that in. */
function moveMarrow(state: GameState, marrow: AiShip, point: Vector2D) {
    marrow.motion.clear();
    marrow.motion.push(new MotionKeyframe(state.currentTime, point.x, point.y, 0));
    marrow.ai.commander.update(marrow.ai.blackboard, state.currentTime);
}

function hasExtendShields(ship: PlayerShip) {
    return ship.engineerState.hand.some(card => card.type === 'extendShields');
}

type CrossingOptions = {
    /** Called on every tick, before the game moves on, with what has been said so far. */
    eachTick?: (hails: readonly string[]) => void;
    /** Stop once this is true, if that's before the encounter is over. */
    until?: () => boolean;
};

/** Plays the encounter out, AI and all, noting everything that's said. The room's timers aren't otherwise running, so those are moved on as well. */
function runCrossing(state: GameState, { eachTick, until }: CrossingOptions = {}) {
    const tick = 100;
    const start = state.currentTime;
    const hails: string[] = [];

    for (let elapsed = 0; elapsed < 400_000 && state.encounter!.outcome === null && !until?.(); elapsed += tick) {
        eachTick?.(hails);
        state.tick(tick);

        for (const delayed of [...rooms.getClock().delayed]) {
            if (delayed.active) {
                delayed.tick(tick);
            }
        }

        if (state.hail && state.hail.text !== hails[hails.length - 1]) {
            hails.push(state.hail.text);
        }
    }

    return { hails, seconds: (state.currentTime - start) / 1000 };
}

describe('SlowBoatEncounter', () => {
    it('has a friendly clinic ship flying its own route, with two harriers after it', () => {
        const { state, ship, marrow, waypoints, harriers } = createSlowBoat();

        expect(state.encounter!.objective).toEqual({ type: 'protect', subject: 'Marrow' });
        expect(state.factionRegistry.getRelationship(ship, marrow)).toBe(RelationshipType.Friendly);
        expect(marrow.name).toBe('Clinic Ship Marrow');
        expect(marrow.ai.blackboard.goal).toBe('travel-route');
        expect(waypoints).toHaveLength(3);

        expect(harriers.map(harrier => harrier.name)).toEqual(['Harrier One', 'Harrier Two']);
        for (const harrier of harriers) {
            expect(state.factionRegistry.areHostile(harrier, marrow)).toBe(true);
            expect(state.factionRegistry.areHostile(harrier, ship)).toBe(true);
        }

        expect(state.hail).toMatchObject({ speaker: 'Clinic Ship Marrow' });
    });

    it('starts the clinic ship alongside the player ship, and the harriers astern of it', () => {
        const { state, ship, marrow, harriers } = createSlowBoat();
        const own = ship.getPosition(state.currentTime);
        const clinic = marrow.getPosition(state.currentTime);

        expect(clinic.x).toBe(own.x);
        expect(Math.abs(clinic.y - own.y)).toBeLessThanOrEqual(4);
        expect(clinic.angle).toBe(own.angle);

        for (const harrier of harriers) {
            expect(harrier.getPosition(state.currentTime).x).toBeLessThan(clinic.x);
        }
    });

    it('has the harriers go for the clinic ship, not the player ship beside it', () => {
        const { state, marrow, harriers } = createSlowBoat();

        for (const harrier of harriers) {
            harrier.updateKnownObjects(state.currentTime);

            // Its commander doesn't reassess the situation on every update, so give it plenty.
            for (let i = 0; i < 30; i++) {
                harrier.ai.commander.update(harrier.ai.blackboard, state.currentTime);
            }

            expect(harrier.ai.blackboard.targetId).toBe(marrow.id);
        }
    });

    it('keeps an Extend Shields card in the engineer\'s hand whenever the shields aren\'t extended, and it\'s gone afterwards', () => {
        const { state, campaign, ship, marrow, waypoints } = createSlowBoat();
        const inDeck = () => ship.engineerState.deck.some(candidate => candidate.type === 'extendShields');
        const card = ship.engineerState.hand.find(candidate => candidate.type === 'extendShields')!;

        expect(card).toBeDefined();
        expect(card.hasTrait('expendable')).toBe(true);
        expect(inDeck()).toBe(false);

        // Playing it uses it up, and there isn't another while its effect lasts.
        expect(ship.engineerState.playCard(card.id, 'extendShields', 'no-target', '')).not.toBeNull();
        expect(ship.hasExtendedShields).toBe(true);
        campaign.tick(0);
        expect(hasExtendShields(ship)).toBe(false);
        expect(inDeck()).toBe(false);

        // Once that's run out, there's another, and only the one.
        getHullTile(ship).removeEffect('shieldsExtended', false);
        campaign.tick(0);
        campaign.tick(0);
        expect(ship.engineerState.hand.filter(candidate => candidate.type === 'extendShields')).toHaveLength(1);

        for (const waypoint of waypoints) {
            moveMarrow(state, marrow, waypoint);
        }
        campaign.tick(0);
        expect(campaign.warpAway(ship)).toBe(true);

        expect(hasExtendShields(ship)).toBe(false);
        expect(ship.engineerState.deck.some(candidate => candidate.type === 'extendShields')).toBe(false);
    });

    it('is a success once the clinic ship reaches the end of its route, and then everyone leaves', () => {
        const { state, campaign, ship, marrow, waypoints, harriers } = createSlowBoat();

        moveMarrow(state, marrow, waypoints[0]);
        moveMarrow(state, marrow, waypoints[1]);
        campaign.tick(0);
        expect(state.encounter!.outcome).toBeNull();

        moveMarrow(state, marrow, waypoints[2]);
        campaign.tick(0);

        expect(state.encounter!.outcome).toBe('success');
        expect(ship.antimatter).toBe(antimatterRewards.combat);
        expect(state.objects.has(marrow.id)).toBe(false);
        expect(harriers.map(harrier => harrier.ai.commander.isWithdrawing)).toEqual([true, true]);
        expect(state.hail).toMatchObject({ speaker: 'Clinic Ship Marrow' });
        expect(state.hail!.text).toContain('Jump point');
    });

    it('is a failure if the clinic ship is destroyed: nothing is earned, nothing is said, and the harriers leave', () => {
        const { state, campaign, ship, marrow, harriers } = createSlowBoat();

        marrow.destroy();

        expect(state.encounter!.outcome).toBe('failure');
        expect(ship.antimatter).toBe(0);
        expect(state.hail).toBeNull();
        expect(harriers.map(harrier => harrier.ai.commander.isWithdrawing)).toEqual([true, true]);

        // The run carries on.
        expect(state.gameStatus).not.toBe('ended');
        expect(campaign.warpAway(ship)).toBe(true);
        expect(state.phase).toBe('map');
    });

    it('is still undecided however many harriers are destroyed or driven off', () => {
        const { state, harriers } = createSlowBoat();

        harriers[0].destroy();
        harriers[1].depart();

        expect(state.encounter!.outcome).toBeNull();
    });

    it('brings another harrier every so often, while there are fewer than the most allowed at once', () => {
        const { state, campaign } = createSlowBoat();
        const names = () => getHostileShips(state).map(harrier => harrier.name);

        state.currentTime += harrierIntervalMs - 1;
        campaign.tick(0);
        expect(names()).toHaveLength(2);

        state.currentTime += 1;
        campaign.tick(0);
        expect(names()).toEqual(['Harrier One', 'Harrier Two', 'Harrier Three']);
        expect(names()).toHaveLength(maxHarriers);

        state.currentTime += harrierIntervalMs;
        campaign.tick(0);
        expect(names()).toHaveLength(maxHarriers);

        // Once one has gone, the next to arrive takes the next name, not its place.
        getHostileShips(state)[0].destroy();
        state.currentTime += harrierIntervalMs;
        campaign.tick(0);
        expect(names()).toEqual(['Harrier Two', 'Harrier Three', 'Harrier Four']);
    });

    describe('hails', () => {
        it('has the clinic ship say how its shields are holding up, once for each stage', () => {
            const { state, campaign, marrow } = createSlowBoat();
            const opening = state.hail!.text;

            campaign.tick(0);
            expect(state.hail!.text).toBe(opening);

            setShields(marrow, 0.7);
            campaign.tick(0);
            expect(state.hail).toMatchObject({ speaker: 'Clinic Ship Marrow', text: 'Taking hits. Shields are holding.' });

            // It doesn't say so again.
            state.showHail('Someone', 'Something else.');
            campaign.tick(0);
            expect(state.hail).toMatchObject({ speaker: 'Someone' });
        });

        it('only says the worst of it, if the shields fall a long way at once', () => {
            const { state, campaign, marrow } = createSlowBoat();

            setShields(marrow, 0.2);
            campaign.tick(0);

            expect(state.hail!.text).toContain('almost gone');

            state.showHail('Someone', 'Something else.');
            campaign.tick(0);
            expect(state.hail).toMatchObject({ speaker: 'Someone' });
        });

        it('has the clinic ship say which harrier it is shooting at, once its opening line has been read', () => {
            const { state, campaign, marrow, harriers } = createSlowBoat();
            marrow.ai.blackboard.targetId = harriers[1].id;

            campaign.tick(0);
            expect(state.hail!.text).not.toContain('We have');

            state.currentTime += 30_000;
            campaign.tick(0);
            expect(state.hail).toMatchObject({ speaker: 'Clinic Ship Marrow', text: 'We have Harrier Two.' });

            // Not again for the same one.
            state.showHail('Someone', 'Something else.');
            state.currentTime += 30_000;
            campaign.tick(0);
            expect(state.hail).toMatchObject({ speaker: 'Someone' });
        });

        it('has the first harrier to give up say so', () => {
            const { state, campaign, harriers } = createSlowBoat();
            harriers[1].ai.blackboard.goal = 'flee';

            campaign.tick(0);
            expect(state.hail).toMatchObject({ speaker: 'Harrier Two', text: 'Not worth it. Breaking off.' });

            state.showHail('Someone', 'Something else.');
            harriers[0].ai.blackboard.goal = 'flee';
            campaign.tick(0);
            expect(state.hail).toMatchObject({ speaker: 'Someone' });
        });
    });

    describe('elite', () => {
        /** The elite form, started through the campaign's own code, which can only load the regular one standalone. */
        function createEliteSlowBoat() {
            const state = rooms.createState(seededRandom(3));
            const { campaign, ships } = startCampaign(state);
            state.message = null;
            (campaign as unknown as { startEncounter(node: SectorNodeInfo): void }).startEncounter({ ...getDefaultNode('slowBoat'), elite: true });

            const marrow = state.getObjectByScenarioId(marrowScenarioId) as AiShip;
            const waypoints = (campaign.activeEncounter as unknown as { waypoints: Vector2D[] }).waypoints;

            return { state, campaign, ship: ships[0], marrow, waypoints };
        }

        /** Moves on to when the harriers' leader makes its offer. */
        function hearOffer(state: GameState, campaign: Campaign) {
            state.currentTime += offerAtMs;
            campaign.tick(0);
        }

        it('is asked nothing in the regular form', () => {
            const { state, campaign } = createSlowBoat();

            state.currentTime += offerAtMs * 2;
            campaign.tick(0);

            expect(state.prompt).toBeNull();
        });

        it('has the harriers\' leader offer to leave for a share of the stores, a minute in', () => {
            const { state, campaign } = createEliteSlowBoat();

            state.currentTime += offerAtMs - 1;
            campaign.tick(0);
            expect(state.prompt).toBeNull();

            state.currentTime += 1;
            campaign.tick(0);

            expect(state.prompt).toMatchObject({ speaker: 'Stranded Lead' });
            expect(state.prompt!.options.map(option => option.id)).toEqual([offerAnswers.handOver, offerAnswers.refuse]);
            expect(state.prompt!.countdown.endTime - state.prompt!.countdown.startTime).toBe(offerTimeoutMs);
        });

        it('only makes the offer once', () => {
            const { state, campaign } = createEliteSlowBoat();
            hearOffer(state, campaign);
            expect(campaign.answerPrompt(offerAnswers.refuse)).toBe(true);

            state.currentTime += offerAtMs;
            campaign.tick(0);

            expect(state.prompt).toBeNull();
        });

        it('ends the fighting if the stores are handed over, for half the reward', () => {
            const { state, campaign, ship, marrow, waypoints } = createEliteSlowBoat();
            hearOffer(state, campaign);
            const harriers = getHostileShips(state);

            expect(campaign.answerPrompt(offerAnswers.handOver)).toBe(true);

            expect(state.prompt).toBeNull();
            expect(harriers.every(harrier => harrier.ai.commander.isWithdrawing)).toBe(true);
            expect(state.hail).toMatchObject({ speaker: 'Stranded Lead' });

            // No more come, however long the rest of the crossing takes.
            state.currentTime += harrierIntervalMs * 3;
            campaign.tick(0);
            expect(getHostileShips(state)).toHaveLength(harriers.length);

            for (const waypoint of waypoints) {
                moveMarrow(state, marrow, waypoint);
            }
            campaign.tick(0);

            expect(state.encounter!.outcome).toBe('success');
            expect(ship.antimatter).toBe(antimatterRewards.elite * boughtCrossingScore);
        });

        it('brings another harrier at once if the offer is refused, and lets one more be here than before', () => {
            const { state, campaign, ship, marrow, waypoints } = createEliteSlowBoat();
            hearOffer(state, campaign);
            const before = getHostileShips(state).length;

            expect(campaign.answerPrompt(offerAnswers.refuse)).toBe(true);

            expect(getHostileShips(state)).toHaveLength(before + 1);
            expect(state.hail).toMatchObject({ speaker: 'Stranded Lead' });

            state.currentTime += harrierIntervalMs * 3;
            campaign.tick(0);
            state.currentTime += harrierIntervalMs;
            campaign.tick(0);
            expect(getHostileShips(state)).toHaveLength(maxHarriers + 1);

            // Seeing it through regardless is worth the whole reward.
            for (const waypoint of waypoints) {
                moveMarrow(state, marrow, waypoint);
            }
            campaign.tick(0);
            expect(ship.antimatter).toBe(antimatterRewards.elite);
        });

        it('takes silence for a refusal, once the time to answer has run out', () => {
            const { state, campaign } = createEliteSlowBoat();
            hearOffer(state, campaign);
            const before = getHostileShips(state).length;

            state.currentTime += offerTimeoutMs - 1;
            campaign.tick(0);
            expect(state.prompt).not.toBeNull();

            state.currentTime += 1;
            campaign.tick(0);

            expect(state.prompt).toBeNull();
            expect(getHostileShips(state)).toHaveLength(before + 1);
        });

        it('withdraws the offer if the clinic ship is destroyed while it stands', () => {
            const { state, campaign, marrow } = createEliteSlowBoat();
            hearOffer(state, campaign);

            marrow.destroy();

            expect(state.encounter!.outcome).toBe('failure');
            expect(state.prompt).toBeNull();
            expect(campaign.answerPrompt(offerAnswers.handOver)).toBe(false);
        });
    });

    describe('played out with the real AI', () => {
        it('the clinic ship flies its whole route, warning of each turn before it makes it, and is thanked at the end', () => {
            const { state, marrow, harriers } = createSlowBoat();
            const heardAtWaypoint: string[][] = [];

            // Its shields are kept up, so this is only about the flying.
            const { hails, seconds } = runCrossing(state, {
                eachTick: (heard) => {
                    marrow.hullState.restoreShields();

                    const reached = marrow.ai.commander.waypointsReached;
                    if (reached > heardAtWaypoint.length) {
                        heardAtWaypoint.push([...heard]);
                    }
                },
            });

            expect(state.encounter!.outcome).toBe('success');
            expect(heardAtWaypoint[0]).toContain('Coming about to port in five.');
            expect(heardAtWaypoint[0]).not.toContain('Coming about to starboard in five.');
            expect(heardAtWaypoint[1]).toContain('Coming about to starboard in five.');
            expect(hails[hails.length - 1]).toContain('Jump point');

            // Long enough to make a plan and change it, short enough for a sector to fit in half an hour.
            expect(seconds).toBeGreaterThan(150);
            expect(seconds).toBeLessThan(260);

            expect(harriers.every(harrier => harrier.ai.commander.isWithdrawing)).toBe(true);
        });

        it.each([7, 11])('a crew that does nothing loses the clinic ship before it gets there (seed %i)', (seed) => {
            const { state } = createSlowBoat(seed);

            const { hails } = runCrossing(state);

            expect(state.encounter!.outcome).toBe('failure');
            expect(hails).toContain('Shields are almost gone. We can\'t take much more of this.');
        });

        it.each([7, 11])('a crew that stays close with its shields extended gets it there, at the cost of its own shields (seed %i)', (seed) => {
            const { state, ship, marrow } = createSlowBoat(seed);
            const ownShield = ship.hullState.shield;

            runCrossing(state, {
                eachTick: () => {
                    // Helm keeps alongside, and the engineer keeps the shields out.
                    const position = marrow.getPosition(state.currentTime);
                    ship.setMotion(new MotionKeyframe(state.currentTime, position.x, position.y - 2, position.angle));

                    if (!ship.hasExtendedShields) {
                        getHullTile(ship).addEffect('shieldsExtended');
                    }
                },
            });

            expect(state.encounter!.outcome).toBe('success');
            // Most of them, as that's all the crew did: nobody fired a shot.
            expect(ship.hullState.shield).toBeLessThan(ownShield / 2);
        });
    });
});

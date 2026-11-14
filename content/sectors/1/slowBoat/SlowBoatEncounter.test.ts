import { getHailDuration, minHailDuration } from 'common-data/features/sectors/types/HailInfo';
import { antimatterRewards } from 'common-data/features/ships/utils/antimatter';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { MotionKeyframe } from 'engine/state/MotionKeyframe';
import { listenToHails, seededRandom, setupGameRoom, startCampaign } from 'engine/testUtils';
import { getHostileShips } from 'engine/utils/shipQueries';
import { describe, expect, it } from 'vitest';
import { boughtCrossingScore, harrierIntervalMs, marrowScenarioId, maxHarriers, offerAnswers, offerAtMs, offerTimeoutMs } from './SlowBoatEncounter.engine';
import type { Vector2D } from 'common-data/features/space/types/Vector2D';
import type { Campaign } from 'engine/campaign/Campaign';
import type { AiShip } from 'engine/state/AiShip';
import type { GameState } from 'engine/state/GameState';
import type { PlayerShip } from 'engine/state/PlayerShip';
import type { Ship } from 'engine/state/Ship';
import type { HullSystemTile } from 'engine/state/systems/engineer/HullSystemTile';

const rooms = setupGameRoom();

/** A campaign running Slow Boat, with the clinic ship and the harriers picked out. */
function createSlowBoat(seed = 3, elite = false) {
    const state = rooms.createState(seededRandom(seed));
    const { campaign, ships } = startCampaign(state);
    campaign.devLoadEncounter('slowBoat', elite);

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

/** Puts the clinic ship at the given point, without its commander noticing yet. */
function placeMarrow(state: GameState, marrow: AiShip, point: Vector2D) {
    marrow.motion.clear();
    marrow.motion.push(new MotionKeyframe(state.currentTime, point.x, point.y, 0));
}

/** Puts the clinic ship at the given point, and lets its commander take that in. */
function moveMarrow(state: GameState, marrow: AiShip, point: Vector2D) {
    placeMarrow(state, marrow, point);
    marrow.ai.commander.update(marrow.ai.blackboard, state.currentTime);
}

/** Lets the clinic ship's opening line be read, so whatever's said next is said straight away. */
function hearOpening(state: GameState) {
    listenToHails(state, getHailDuration(state.hail!.text));
}

function hasExtendShields(ship: PlayerShip) {
    return ship.engineerState.hand.some(card => card.type === 'extendShields');
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

    it('keeps an Extend Shields card in the engineer\'s hand for as long as it lasts, and it\'s gone afterwards', () => {
        const { state, campaign, ship, marrow, waypoints } = createSlowBoat();
        const engineer = ship.engineerState;
        const inDeck = () => engineer.deck.some(candidate => candidate.type === 'extendShields');
        const card = engineer.hand.find(candidate => candidate.type === 'extendShields')!;

        expect(card).toBeDefined();
        expect(inDeck()).toBe(false);

        // Playing it puts the shields out, and it comes straight back, to be played again whenever the engineer likes.
        Object.assign(engineer, { powerLevel: 5 });
        expect(engineer.playCard(card.id, 'extendShields', 'no-target', '')).not.toBeNull();
        expect(ship.hasExtendedShields).toBe(true);
        expect(engineer.hand.filter(candidate => candidate.type === 'extendShields')).toEqual([card]);
        expect(inDeck()).toBe(false);

        for (const waypoint of waypoints) {
            moveMarrow(state, marrow, waypoint);
        }
        campaign.tick(0);
        expect(campaign.warpAway(ship)).toBe(true);

        expect(hasExtendShields(ship)).toBe(false);
        expect(inDeck()).toBe(false);
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
        expect(listenToHails(state, minHailDuration)).toEqual([{ speaker: 'Clinic Ship Marrow', text: 'Jump point. Forty patients say thank you, and so do I.' }]);
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
            const { state, marrow } = createSlowBoat();
            hearOpening(state);

            setShields(marrow, 0.7);
            const heard = listenToHails(state, 30_000);

            expect(heard).toEqual([{ speaker: 'Clinic Ship Marrow', text: 'Taking hits. Shields are holding.' }]);
        });

        it('only says the worst of it, if the shields fall a long way at once', () => {
            const { state, marrow } = createSlowBoat();
            hearOpening(state);

            setShields(marrow, 0.2);
            const heard = listenToHails(state, 30_000);

            expect(heard.map(hail => hail.text)).toEqual(['Shields are almost gone. We can\'t take much more of this.']);
        });

        it('lets the opening line be read before saying anything else', () => {
            const { state, marrow } = createSlowBoat();
            const opening = state.hail!.text;

            setShields(marrow, 0.7);
            listenToHails(state, getHailDuration(opening) - 100);

            expect(state.hail!.text).toBe(opening);
        });

        it('has the clinic ship say which harrier it is shooting at, when nothing else is being said, and not again for the same one', () => {
            const { state, marrow, harriers } = createSlowBoat();
            marrow.ai.blackboard.targetId = harriers[1].id;

            const heard = listenToHails(state, 60_000).map(hail => hail.text);

            expect(heard).toEqual(['We have Harrier Two.']);
        });

        it('has the first harrier to give up say so, and no other', () => {
            const { state, harriers } = createSlowBoat();
            hearOpening(state);
            harriers[1].ai.blackboard.goal = 'flee';

            expect(listenToHails(state, 100)).toEqual([{ speaker: 'Harrier Two', text: 'Not worth it. Breaking off.' }]);

            harriers[0].ai.blackboard.goal = 'flee';
            expect(listenToHails(state, 30_000).filter(hail => hail.speaker.startsWith('Harrier'))).toEqual([]);
        });

        it('has the clinic ship warn of each turn but the last, cutting short whatever else is being said', () => {
            const { state, campaign, marrow, waypoints } = createSlowBoat();
            marrow.ai.blackboard.targetId = null;

            // A little before the first turn, which is to port, while it's saying something else.
            hearOpening(state);
            setShields(marrow, 0.7);
            campaign.tick(0);
            expect(state.hail!.text).toBe('Taking hits. Shields are holding.');

            placeMarrow(state, marrow, waypoints[0]);
            expect(listenToHails(state, minHailDuration).map(hail => hail.text)).toEqual(['Coming about to port in five.']);

            // Then the second, back to starboard, once that's been said.
            listenToHails(state, getHailDuration(state.hail!.text));
            moveMarrow(state, marrow, waypoints[0]);
            placeMarrow(state, marrow, waypoints[1]);
            expect(listenToHails(state, 10_000).map(hail => hail.text)).toEqual(['Coming about to starboard in five.']);

            // Nothing before the last, which is the jump point.
            moveMarrow(state, marrow, waypoints[1]);
            placeMarrow(state, marrow, waypoints[2]);
            expect(listenToHails(state, 100)).toEqual([]);
        });
    });

    describe('elite', () => {
        function createEliteSlowBoat() {
            return createSlowBoat(3, true);
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
});

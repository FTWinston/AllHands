import { antimatterRewards } from 'common-data/features/ships/utils/antimatter';
import { flareDuration } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { distance } from 'common-data/features/space/utils/vectors';
import { playerFactionId } from 'src/campaign/factions';
import { MotionKeyframe } from 'src/state/MotionKeyframe';
import { listenToHails, seededRandom, setupGameRoom, startCampaign } from 'src/testUtils';
import { describe, expect, it } from 'vitest';
import {
    alertMs, allowance, arrivalRadius, defectorSensor, elitePicketCount, facingArc, flaresGiven, inStepMs, picketCount, relayDistance, relayScenarioId, ringRadius,
    seenScore, sensorCycle, sensorStepMs, sightRange, signatureOf, watchIntervalMs, windowMs,
    type QuietRunningEncounter,
} from './QuietRunningEncounter';
import type { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import type { Vector2D } from 'common-data/features/space/types/Vector2D';
import type { AiShip } from 'src/state/AiShip';
import type { GameState } from 'src/state/GameState';
import type { Ship } from 'src/state/Ship';

const rooms = setupGameRoom();

const keeper = 'Ketch Relay';
const briefing = 'They add up all your power. Their sensors breathe: low, middle, high, middle. High sees anything. Middle lets you show ten, low fourteen. Find two breathing together, and go between them as they drop. I can hold the door three minutes.';

function createRun({ elite = false, seed = 3 } = {}) {
    const state = rooms.createState(seededRandom(seed));
    const { campaign, ships } = startCampaign(state);
    campaign.devLoadEncounter('quietRunning', elite);
    const encounter = campaign.activeEncounter as QuietRunningEncounter;

    return {
        state,
        campaign,
        ship: ships[0],
        encounter,
        relay: state.getObjectByScenarioId(relayScenarioId) as AiShip,
    };
}

type Run = ReturnType<typeof createRun>;

const at = (state: GameState, object: { getPosition(time: number): Vector2D }) => object.getPosition(state.currentTime);

/** Puts a ship where it's wanted, holding still. */
function place(state: GameState, ship: Ship, { x, y }: Vector2D) {
    ship.setMotion(new MotionKeyframe(state.currentTime, x, y, 0));
}

/** Moves the campaign on, without moving anything in the game. */
function wait({ state, campaign }: Run, ms: number) {
    for (let elapsed = 0; elapsed < ms; elapsed += 100) {
        state.currentTime += 100;
        campaign.tick(100);
    }
}

/** The middle of the gap between two neighbouring pickets, on the ring. */
function gapMiddle({ state, relay }: Run, a: AiShip, b: AiShip): Vector2D {
    const centre = at(state, relay);
    const pa = at(state, a);
    const pb = at(state, b);
    const mid = { x: (pa.x + pb.x) / 2 - centre.x, y: (pa.y + pb.y) / 2 - centre.y };
    const length = Math.hypot(mid.x, mid.y);
    return { x: centre.x + mid.x / length * ringRadius, y: centre.y + mid.y / length * ringRadius };
}

const tile = (ship: Ship, system: ShipSystem) => ship.engineerState.systems.find(candidate => candidate.system === system)!;

/** Runs these of the ship's systems quiet, as Run Quiet does. */
function runQuiet(ship: Ship, ...systems: ShipSystem[]) {
    for (const system of systems) {
        tile(ship, system).addEffect('runningQuiet');
    }
}

/** All pickets at 1, then the ones given at the levels given. */
function setSensors(encounter: QuietRunningEncounter, levels: [AiShip, 1 | 3 | 5][] = []) {
    for (const picket of encounter.pickets) {
        encounter.setSensors(picket, 1);
    }
    for (const [picket, level] of levels) {
        encounter.setSensors(picket, level);
    }
}

const isHostile = ({ state }: Run, faction: string) => state.factionRegistry.getRelationshipBetween(faction, playerFactionId) === RelationshipType.Hostile;

describe('QuietRunningEncounter', () => {
    describe('the cordon', () => {
        it('has the relay straight ahead, with a ring of neutral pickets round it, each holding its own position', () => {
            const run = createRun();
            const { state, encounter, relay } = run;

            expect(state.encounter!.objective).toEqual({ type: 'reach', subject: 'Ketch Relay' });
            expect(relay.name).toBe(keeper);
            expect(at(state, relay)).toMatchObject({ x: relayDistance, y: 0 });
            expect(state.factionRegistry.getRelationshipBetween(relay.faction, playerFactionId)).toBe(RelationshipType.Friendly);

            expect(encounter.pickets).toHaveLength(picketCount);
            expect(encounter.pickets.map(picket => picket.name)).toEqual(['One', 'Two', 'Three', 'Four', 'Five', 'Six'].map(number => `Warden Picket ${number}`));
            for (const picket of encounter.pickets) {
                const position = at(state, picket);
                expect(distance(position, at(state, relay))).toBeCloseTo(ringRadius);
                expect(state.factionRegistry.getRelationshipBetween(picket.faction, playerFactionId)).toBe(RelationshipType.Neutral);
                expect(picket.ai.commander.goal).toEqual({ type: 'defend-position', position: expect.objectContaining({ x: position.x, y: position.y }), radius: 30 });
            }
            expect(encounter.defector).toBeNull();
        });

        it('turns the ring by a different angle each time', () => {
            const angles = [3, 7].map((seed) => {
                const { state, encounter, relay } = createRun({ seed });
                const first = at(state, encounter.pickets[0]);
                const centre = at(state, relay);
                return Math.atan2(first.y - centre.y, first.x - centre.x);
            });

            expect(angles[0]).not.toBeCloseTo(angles[1]);
        });

        it('briefs the crew first, and keeps Run Quiet in the engineer\'s hand and a flare in tactical\'s', () => {
            const run = createRun();

            expect(run.state.hail).toMatchObject({ speaker: keeper, text: briefing });
            expect(run.ship.engineerState.hand.some(card => card.type === 'runQuiet')).toBe(true);
            expect(run.ship.tacticalState.hand.some(card => card.type === 'flare')).toBe(true);
        });
    });

    describe('signature and allowance', () => {
        it('counts all six systems\' power: 18 as the crew arrives, 6 with everything running quiet', () => {
            const { ship } = createRun();

            expect(signatureOf(ship)).toBe(18);
            runQuiet(ship, 'hull', 'reactor', 'helm', 'science', 'tactical', 'engineer');
            expect(signatureOf(ship)).toBe(6);
        });

        it('allows 14 on low, 10 on middle, and nothing on high, wherever the ship is', () => {
            expect(allowance(1)).toBe(14);
            expect(allowance(3)).toBe(10);
            expect(allowance(5)).toBeLessThan(0);
        });

        it('fits helm and one other system lit on middle, and helm and two on low', () => {
            const { ship } = createRun();

            runQuiet(ship, 'hull', 'reactor', 'tactical', 'engineer');
            expect(signatureOf(ship)).toBe(allowance(3));

            tile(ship, 'tactical').removeEffect('runningQuiet', 'early');
            expect(signatureOf(ship)).toBeGreaterThan(allowance(3));
            expect(signatureOf(ship)).toBeLessThanOrEqual(allowance(1));
        });
    });

    describe('being seen', () => {
        it.each([
            ['both on middle, helm and science lit', 3, 3, ['hull', 'reactor', 'tactical', 'engineer'], false],
            ['both on middle, helm, science and tactical lit', 3, 3, ['hull', 'reactor', 'engineer'], true],
            ['both on low, helm, science and tactical lit', 1, 1, ['hull', 'reactor', 'engineer'], false],
            ['one on low and one on middle, helm, science and tactical lit', 1, 3, ['hull', 'reactor', 'engineer'], true],
            ['both on low, one system quiet', 1, 1, ['tactical'], true],
            ['one on high, everything quiet', 1, 5, ['hull', 'reactor', 'helm', 'science', 'tactical', 'engineer'], true],
        ] as [string, 1 | 3 | 5, 1 | 3 | 5, ShipSystem[], boolean][])('at the middle of a gap, with its pickets %s: seen %s', (_, left, right, quiet, seen) => {
            const run = createRun();
            const { state, ship, encounter } = run;
            const [one, two] = encounter.pickets;
            setSensors(encounter, [[one, left], [two, right]]);
            runQuiet(ship, ...quiet);
            place(state, ship, gapMiddle(run, one, two));
            expect(distance(at(state, ship), at(state, one))).toBeCloseTo(14.5, 1);

            wait(run, watchIntervalMs * 2);

            expect(encounter.isSeen).toBe(seen);
        });

        it('has the two pickets nearest a ship watch it, even where only one of them is close enough to see it', () => {
            for (const level of [3, 5] as const) {
                const run = createRun();
                const { state, ship, encounter } = run;
                const [one, two] = encounter.pickets;
                setSensors(encounter, [[two, level]]);
                runQuiet(ship, 'hull', 'reactor', 'helm', 'science', 'tactical', 'engineer');
                // On the ring, close by One, and too far from Two for it to see the ship by itself.
                const a = at(state, one);
                const b = at(state, two);
                place(state, ship, { x: a.x + (b.x - a.x) / 4, y: a.y + (b.y - a.y) / 4 });
                expect(distance(at(state, ship), b)).toBeGreaterThan(sightRange);

                wait(run, watchIntervalMs * 2);

                expect(encounter.isSeen).toBe(level === 5);
            }
        });

        it('doesn\'t see a ship inside the ring that\'s out of every picket\'s sight, with everything lit and every picket on high', () => {
            const run = createRun();
            const { state, ship, encounter } = run;
            setSensors(encounter, encounter.pickets.map(picket => [picket, 5]));
            const centre = at(state, run.relay);
            place(state, ship, { x: centre.x - ringRadius + sightRange + 0.5, y: centre.y });
            expect(Math.min(...encounter.pickets.map(picket => distance(at(state, picket), at(state, ship))))).toBeGreaterThan(sightRange);

            wait(run, 5000);

            expect(encounter.isSeen).toBe(false);
        });

        it('doesn\'t see anything beyond its sight, however much power it shows', () => {
            const run = createRun();
            const { state, ship, encounter } = run;
            setSensors(encounter, encounter.pickets.map(picket => [picket, 5]));
            const centre = at(state, run.relay);
            const picket = at(state, encounter.pickets[0]);
            const out = { x: picket.x - centre.x, y: picket.y - centre.y };
            const scale = (ringRadius + sightRange + 0.5) / ringRadius;
            place(state, ship, { x: centre.x + out.x * scale, y: centre.y + out.y * scale });

            wait(run, 5000);

            expect(encounter.isSeen).toBe(false);
        });

        it('turns the Wardens hostile and every picket hunting, and the one that saw says so, then the keeper', () => {
            const run = createRun();
            const { state, ship, encounter } = run;
            const [one, two] = encounter.pickets;
            setSensors(encounter, [[one, 5]]);
            place(state, ship, gapMiddle(run, one, two));
            // The briefing is cut short, as being seen is urgent.
            const heard = listenToHails(state, watchIntervalMs * 2);

            expect(encounter.isSeen).toBe(true);
            expect(isHostile(run, one.faction!)).toBe(true);
            for (const picket of encounter.pickets) {
                expect(picket.ai.commander.goal).toEqual({ type: 'search-and-destroy' });
            }
            expect(heard).toEqual([]);
            expect(state.hail).toMatchObject({ speaker: keeper, text: briefing });
            const after = listenToHails(state, 20_000);
            expect(after[0]).toEqual({ speaker: 'Warden Picket One', text: 'Contact in the cordon. Unregistered. All pickets, converge.' });
            expect(after).toContainEqual({ speaker: keeper, text: 'They\'ve seen you. Run for it. The door\'s open.' });
        });

        it('counts a hit on a picket from the crew as being seen, and not a hit from anyone else', () => {
            const run = createRun();
            const { ship, encounter } = run;
            const [one, two] = encounter.pickets;

            one.damage({ amount: 10, traits: ['energyWeapon'], targetSystem: 'hull', sourceId: two.id });
            expect(encounter.isSeen).toBe(false);

            one.damage({ amount: 10, traits: ['energyWeapon'], targetSystem: 'hull', sourceId: ship.id });
            expect(encounter.isSeen).toBe(true);
            expect(isHostile(run, one.faction!)).toBe(true);
            expect(two.ai.commander.goal).toEqual({ type: 'search-and-destroy' });
        });

        it('is still a success if the crew reaches the relay after being seen, worth half, and whoever was hunting it loses it at the door', () => {
            const run = createRun();
            const { state, ship, encounter, relay } = run;
            encounter.pickets[0].damage({ amount: 10, traits: ['energyWeapon'], targetSystem: 'hull', sourceId: ship.id });
            wait(run, 20_000);

            const centre = at(state, relay);
            place(state, ship, { x: centre.x - arrivalRadius + 0.1, y: centre.y });
            const heard = listenToHails(state, 10_000);

            expect(state.encounter!.outcome).toBe('success');
            expect(encounter.score).toBe(seenScore);
            expect(ship.antimatter).toBe(antimatterRewards.combat * seenScore);
            expect(heard).toContainEqual({ speaker: keeper, text: 'Subtle. Still, that\'s the coupler. Go on, before they work out where you went.' });
            for (const picket of encounter.pickets) {
                expect(picket.ai.commander.isStandingDown).toBe(true);
            }
        });
    });

    describe('played out, AI and all', () => {
        /** Plays the game on. The room's timers aren't otherwise running, so those are moved on as well. */
        function play(state: GameState, ms: number) {
            for (let elapsed = 0; elapsed < ms; elapsed += 100) {
                state.tick(100);
                for (const delayed of [...rooms.getClock().delayed]) {
                    if (delayed.active) {
                        delayed.tick(100);
                    }
                }
            }
        }

        it('has pickets that sit still and hold fire while they\'re neutral, then close in and fire once the crew is seen', () => {
            const run = createRun();
            const { state, ship, encounter } = run;
            // Inside the ring with everything running quiet, where no picket can see it but most could reach it with a cannon once they'd closed.
            runQuiet(ship, 'hull', 'reactor', 'helm', 'science', 'tactical', 'engineer');
            const centre = at(state, run.relay);
            place(state, ship, { x: centre.x - 6, y: centre.y });
            const posts = encounter.pickets.map(picket => at(state, picket));
            const healthy = ship.hullState.health;

            play(state, 60_000);

            expect(encounter.isSeen).toBe(false);
            expect(ship.hullState.health).toBe(healthy);
            encounter.pickets.forEach((picket, index) => expect(distance(at(state, picket), posts[index])).toBeLessThan(1));

            encounter.pickets[0].damage({ amount: 10, traits: ['energyWeapon'], targetSystem: 'hull', sourceId: ship.id });
            const nearest = () => Math.min(...encounter.pickets.map(picket => distance(at(state, picket), at(state, ship))));
            const before = nearest();
            let elapsed = 0;
            for (; elapsed < 60_000 && ship.hullState.health === healthy; elapsed += 1000) {
                play(state, 1000);
            }

            expect(nearest()).toBeLessThan(before - 5);
            expect(ship.hullState.health).toBeLessThan(healthy);
            expect(elapsed).toBeGreaterThan(10_000);
        });
    });

    describe('the pickets\' sensors', () => {
        it('step through 1, 3, 5 and 3 again, one step every ten seconds', () => {
            const run = createRun();
            const { encounter } = run;
            const [picket] = encounter.pickets;
            encounter.setSensors(picket, 1);

            const levels: number[] = [];
            for (let step = 0; step < 6; step++) {
                levels.push(encounter.sensorLevel(picket));
                wait(run, sensorStepMs);
            }

            expect(sensorCycle).toEqual([1, 3, 5, 3]);
            expect(levels).toEqual([1, 3, 5, 3, 1, 3]);
        });

        it('start at different points in the cycle', () => {
            const { encounter } = createRun();

            expect(new Set(encounter.pickets.map(picket => encounter.sensorLevel(picket))).size).toBeGreaterThan(1);
        });

        it.each([3, 7, 11, 13, 17])('put one gap facing the crew in step (seed %i)', (seed) => {
            const run = createRun({ seed });
            const { state, encounter, relay } = run;
            const [left, right] = encounter.inStepGap!;
            const pickets = encounter.pickets;
            expect(pickets[(pickets.indexOf(left) + 1) % pickets.length]).toBe(right);

            // Its middle is on the crew's side: the crew comes from the relay's bearing pi.
            const middle = gapMiddle(run, left, right);
            const centre = at(state, relay);
            const bearing = Math.atan2(-(middle.y - centre.y), middle.x - centre.x);
            expect(Math.abs(Math.atan2(Math.sin(bearing - Math.PI), Math.cos(bearing - Math.PI)))).toBeLessThanOrEqual(facingArc);

            // Through a whole cycle, one is on high without the other for no more than they're apart, either side.
            let oneHigh = 0;
            for (let elapsed = 0; elapsed < sensorCycle.length * sensorStepMs; elapsed += 100) {
                if ((encounter.sensorLevel(left) === 5) !== (encounter.sensorLevel(right) === 5)) {
                    oneHigh += 100;
                }
                wait(run, 100);
            }
            expect(oneHigh).toBeLessThanOrEqual(2 * inStepMs + 200);
        });

        it('are what a scan of the picket\'s science system reads, even when its own engineer boosts it', () => {
            const run = createRun();
            const { ship, encounter } = run;
            const [picket] = encounter.pickets;
            encounter.setSensors(picket, 3);
            ship.scienceState.subscribeToSystem(picket, 'science');

            expect(picket.scienceState.powerLevel).toBe(3);
            expect(ship.scienceState.scannedScience!.power).toBe(3);

            tile(picket, 'science').addEffect('auxPower');
            tile(picket, 'science').addEffect('overcharge');
            wait(run, 100);
            expect(picket.scienceState.powerLevel).toBe(3);
            expect(ship.scienceState.scannedScience!.power).toBe(3);

            // Pushed down below nothing, it still reads true, and comes back right when what pushed it goes.
            tile(picket, 'science').removeEffect('overcharge', 'expired');
            tile(picket, 'science').removeEffect('auxPower', 'expired');
            tile(picket, 'science').addEffect('reducedPower', 5);
            wait(run, 100);
            expect(ship.scienceState.scannedScience!.power).toBe(3);

            tile(picket, 'science').removeEffect('reducedPower', 'expired');
            wait(run, 100);
            expect(ship.scienceState.scannedScience!.power).toBe(3);

            encounter.setSensors(picket, 5);
            expect(ship.scienceState.scannedScience!.power).toBe(5);
        });
    });

    describe('flares', () => {
        function launch({ ship }: Run) {
            const card = ship.tacticalState.hand.find(held => held.type === 'flare')!;
            expect(ship.tacticalState.playCard(card.id, 'flare', 'no-target', '')).not.toBeNull();
        }

        /** Lets the flare burn out, as the ship would, and the campaign notice. */
        function burnOut(run: Run) {
            wait(run, flareDuration);
            run.ship.engineerState.update(run.state.currentTime);
            wait(run, 100);
        }

        it('stops every picket seeing while one burns, then puts them all at 5 for a while, then back to their cycle', () => {
            const run = createRun();
            const { state, ship, encounter } = run;
            const [one, two] = encounter.pickets;
            setSensors(encounter);
            place(state, ship, at(state, one));

            launch(run);
            wait(run, 1000);
            expect(encounter.isFlareBurning).toBe(true);
            expect(encounter.isSeen).toBe(false);

            ship.setMotion(new MotionKeyframe(state.currentTime, 0, 0, 0));
            burnOut(run);
            expect(encounter.isFlareBurning).toBe(false);
            expect(encounter.pickets.map(picket => encounter.sensorLevel(picket))).toEqual(encounter.pickets.map(() => 5));
            expect(two.scienceState.powerLevel).toBe(5);

            // They were all set to 1 together, so they're in step: 31 seconds on, that's 3, unless the alert had held them at 5.
            wait(run, alertMs + 2000);
            expect(encounter.pickets.map(picket => encounter.sensorLevel(picket))).toEqual(encounter.pickets.map(() => 3));
        });

        it('sees a ship as soon as a flare goes out, if it\'s showing too much', () => {
            const run = createRun();
            const { state, ship, encounter } = run;
            const [one, two] = encounter.pickets;
            setSensors(encounter);
            launch(run);
            runQuiet(ship, 'tactical', 'science');
            place(state, ship, gapMiddle(run, one, two));
            wait(run, 1000);
            expect(encounter.isSeen).toBe(false);

            burnOut(run);
            wait(run, watchIntervalMs * 2);

            expect(encounter.isSeen).toBe(true);
        });

        it('gives tactical one, and no second', () => {
            const run = createRun();
            const { ship } = run;
            const hasFlare = () => ship.tacticalState.hand.some(card => card.type === 'flare');

            expect(flaresGiven).toBe(1);
            expect(hasFlare()).toBe(true);
            launch(run);
            wait(run, 100);
            expect(hasFlare()).toBe(false);
            burnOut(run);
            expect(hasFlare()).toBe(false);
        });
    });

    describe('the door', () => {
        it('reaching the relay unseen is a success, with the keeper\'s thanks, and the pickets still neutral', () => {
            const run = createRun();
            const { state, ship, relay } = run;
            const centre = at(state, relay);
            runQuiet(ship, 'hull', 'reactor', 'helm', 'science', 'tactical', 'engineer');
            place(state, ship, { x: centre.x, y: centre.y + arrivalRadius - 0.1 });

            const heard = listenToHails(state, 20_000);

            expect(state.encounter!.outcome).toBe('success');
            expect(run.encounter.score).toBe(1);
            expect(ship.antimatter).toBe(antimatterRewards.combat);
            expect(heard).toContainEqual({ speaker: keeper, text: 'I didn\'t see a thing, and neither did they. That\'s the coupler. Thank you.' });
            expect(isHostile(run, run.encounter.pickets[0].faction!)).toBe(false);
        });

        it('isn\'t reached from just outside the arrival radius', () => {
            const run = createRun();
            const { state, ship, relay } = run;
            const centre = at(state, relay);
            runQuiet(ship, 'hull', 'reactor', 'helm', 'science', 'tactical', 'engineer');
            place(state, ship, { x: centre.x - arrivalRadius - 0.1, y: centre.y });

            wait(run, 1000);

            expect(state.encounter!.outcome).toBeNull();
        });

        it('says when a minute and twenty seconds are left, then closes: a failure with no reward, Warp Away offered, and pickets that never saw them still neutral', () => {
            const run = createRun();
            const { state, campaign, ship } = run;

            const heard: string[] = [];
            let current = state.hail;
            for (let elapsed = 0; elapsed < windowMs + 5000; elapsed += 100) {
                state.currentTime += 100;
                campaign.tick(100);
                if (state.hail && state.hail !== current) {
                    heard.push(`${Math.round(elapsed / 1000)}: ${state.hail.text}`);
                }
                current = state.hail;
            }

            expect(heard).toContain(`${(windowMs - 60_000) / 1000}: One minute, then I have to go dark.`);
            expect(heard).toContain(`${(windowMs - 20_000) / 1000}: Twenty seconds.`);
            expect(heard).toContain(`${windowMs / 1000}: That's my window. Going dark. Don't lead them here.`);

            expect(state.encounter!.outcome).toBe('failure');
            expect(ship.antimatter).toBe(0);
            expect(isHostile(run, run.encounter.pickets[0].faction!)).toBe(false);
            expect(campaign.warpAway(ship)).toBe(true);
            expect(state.phase).toBe('map');
        });
    });

    describe('elite', () => {
        it('has eight pickets, one of which has defected, and tells the crew so', () => {
            const run = createRun({ elite: true });
            const { state, encounter } = run;

            expect(encounter.pickets).toHaveLength(elitePicketCount);
            expect(encounter.defector).not.toBeNull();
            expect(encounter.pickets).toContain(encounter.defector);
            // In the game's own order too, which is how target lists show them, so the defector isn't the odd one out.
            const inGameOrder = [...state.objects.values()].filter(object => encounter.pickets.includes(object as AiShip));
            expect(inGameOrder.map(picket => picket.name)).toEqual(['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'].map(number => `Warden Picket ${number}`));
            expect(state.hail!.text).toBe(`${briefing} One of them's stopped answering roll-call. I don't know which.`);
            expect(state.factionRegistry.getRelationshipBetween(encounter.defector!.faction, playerFactionId)).toBe(RelationshipType.Neutral);
            expect(encounter.defector!.appearance).toBe(encounter.pickets.find(picket => picket !== encounter.defector)!.appearance);
        });

        it('has a defector whose sensors read 0 and never change, and which never sees anything', () => {
            const run = createRun({ elite: true });
            const { ship, encounter } = run;
            const defector = encounter.defector!;
            const warden = encounter.pickets.find(picket => picket !== defector)!;
            ship.scienceState.subscribeToSystem(defector, 'science');

            for (let step = 0; step < 6; step++) {
                expect(encounter.sensorLevel(defector)).toBe(defectorSensor);
                expect(ship.scienceState.scannedScience!.power).toBe(0);
                expect(encounter.sees(defector, signatureOf(ship))).toBe(false);
                wait(run, sensorStepMs);
            }

            encounter.setSensors(warden, 5);
            expect(encounter.sees(warden, 0)).toBe(true);
        });

        it('has only one picket watching each gap beside the defector', () => {
            for (const level of [1, 5] as const) {
                const run = createRun({ elite: true });
                const { state, ship, encounter } = run;
                const defector = encounter.defector!;
                const pickets = encounter.pickets;
                const neighbour = pickets[(pickets.indexOf(defector) + 1) % pickets.length];
                setSensors(encounter, [[neighbour, level]]);
                runQuiet(ship, 'hull', 'reactor');
                place(state, ship, gapMiddle(run, defector, neighbour));

                wait(run, watchIntervalMs * 2);

                expect(encounter.isSeen).toBe(level === 5);
            }
        });

        it.each([3, 7, 11, 13, 17])('has the defector on the crew\'s side of the ring (seed %i)', (seed) => {
            const { state, encounter, relay } = createRun({ elite: true, seed });
            const position = at(state, encounter.defector!);
            const centre = at(state, relay);
            const bearing = Math.atan2(-(position.y - centre.y), position.x - centre.x);

            expect(Math.abs(Math.atan2(Math.sin(bearing - Math.PI), Math.cos(bearing - Math.PI)))).toBeLessThanOrEqual(facingArc);
            expect(encounter.inStepGap).toBeNull();
        });

        it('has the defector turn on the Wardens only once the crew is seen, and say so', () => {
            const run = createRun({ elite: true });
            const { state, ship, encounter } = run;
            const defector = encounter.defector!;
            const warden = encounter.pickets.find(picket => picket !== defector)!;

            wait(run, 30_000);
            expect(defector.ai.commander.goal.type).toBe('defend-position');
            expect(state.factionRegistry.getRelationship(defector, warden)).toBe(RelationshipType.Neutral);

            warden.damage({ amount: 10, traits: ['energyWeapon'], targetSystem: 'hull', sourceId: ship.id });
            const heard = listenToHails(state, 10_000);

            expect(state.factionRegistry.getRelationship(defector, warden)).toBe(RelationshipType.Hostile);
            expect(state.factionRegistry.getRelationship(defector, ship)).toBe(RelationshipType.Friendly);
            expect(isHostile(run, warden.faction!)).toBe(true);
            expect(defector.ai.commander.goal).toEqual({ type: 'search-and-destroy' });
            const number = defector.name.replace('Warden Picket ', '');
            expect(heard).toContainEqual({ speaker: defector.name, text: `Picket ${number} to the unregistered ship. Go. I'll keep them looking at me.` });
        });

        it('doesn\'t count firing on the defector as being seen', () => {
            const run = createRun({ elite: true });

            run.encounter.defector!.damage({ amount: 10, traits: ['energyWeapon'], targetSystem: 'hull', sourceId: run.ship.id });

            expect(run.encounter.isSeen).toBe(false);
        });
    });
});

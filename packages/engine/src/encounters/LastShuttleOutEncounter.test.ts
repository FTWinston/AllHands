import { antimatterRewards } from 'common-data/features/ships/utils/antimatter';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { distance } from 'common-data/features/space/utils/vectors';
import { MotionKeyframe } from 'src/state/MotionKeyframe';
import { seededRandom, setupGameRoom, startCampaign } from 'src/testUtils';
import { describe, expect, it, vi } from 'vitest';
import {
    coldAnswers, coldLaunchIntervalMs, firstLaunchMs, lanes, fragmentSpawnDistance, fragmentWaves, laneLength, launchIntervalMs, launchWarningMs, liveInWave,
    questionDelayMs, questionTimeoutMs, reactorFailsAtMs, scheduleAnswers, sendBothDelayMs, stationOffset, stationScenarioId,
    type LastShuttleOutEncounter,
} from './LastShuttleOutEncounter';
import type { WeaponEffect } from 'common-data/features/space/types/WeaponEffect';
import type { AiShip } from 'src/state/AiShip';
import type { GameState } from 'src/state/GameState';
import type { Ship } from 'src/state/Ship';

const rooms = setupGameRoom();

const station = 'Corrie Deep Station';

/** A campaign running Last Shuttle Out. Times in it are counted from when it started. */
function createEvacuation({ elite = false, seed = 3 } = {}) {
    const state = rooms.createState(seededRandom(seed));
    const { campaign, ships } = startCampaign(state);
    campaign.devLoadEncounter('lastShuttleOut', elite);
    const start = state.currentTime;

    return {
        state,
        campaign,
        ship: ships[0],
        encounter: campaign.activeEncounter as LastShuttleOutEncounter,
        /** Seconds since it started. */
        elapsed: () => (state.currentTime - start) / 1000,
    };
}

type Evacuation = ReturnType<typeof createEvacuation>;

const named = (state: GameState, prefix: string) => [...state.objects.values()].filter(object => object.name.startsWith(prefix)) as AiShip[];
const shuttleNamed = (state: GameState, name: string) => named(state, `Shuttle ${name}`)[0];

/**
 * Moves the campaign on, a tenth of a second at a time, without moving anything in the game, and returns what was said, with when.
 * A line that goes up on the very tick that caused it is heard too.
 */
function hearUntil({ state, campaign, elapsed }: Evacuation, seconds: number): string[] {
    const heard: string[] = [];
    let current = state.hail;

    while (elapsed() < seconds - 1e-9) {
        state.currentTime += 100;
        campaign.tick(100);

        if (state.hail && state.hail !== current) {
            heard.push(`${Math.round(elapsed())}: ${state.hail.text}`);
        }
        current = state.hail;
    }

    return heard;
}

/** Plays the game on, AI and all. The room's timers aren't otherwise running, so those are moved on as well. */
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

/** Puts a ship where it's wanted, holding still. */
function place(state: GameState, ship: Ship, x: number, y: number, angle = 0) {
    ship.setMotion(new MotionKeyframe(state.currentTime, x, y, angle));
}

/** Has a ship's commander notice what's changed. It skips some updates at low skill, so give it a few. */
function letCommanderNotice(state: GameState, ship: AiShip) {
    for (let i = 0; i < 30; i++) {
        ship.ai.commander.update(ship.ai.blackboard, state.currentTime);
    }
}

/** Has a shuttle fly the rest of its lane at once, and the campaign notice. */
function arrive({ state, campaign }: Evacuation, shuttle: AiShip) {
    flyLeg(state, shuttle);
    campaign.tick(0);
}

/** Puts a ship on a route at the waypoint it's making for, and has it notice. */
function flyLeg(state: GameState, ship: AiShip) {
    letCommanderNotice(state, ship);
    const { x, y } = ship.ai.blackboard.destination!;
    place(state, ship, x, y);
    letCommanderNotice(state, ship);
}

/** What's being said just now, if anything, and what's said after it, until the given time. */
function hearFromNow(evacuation: Evacuation, seconds: number): string[] {
    const { state, elapsed } = evacuation;
    const current = state.hail ? [`${Math.round(elapsed())}: ${state.hail.text}`] : [];
    return [...current, ...hearUntil(evacuation, seconds)];
}

/** The time each shuttle is called, as it's said. */
const launchCalls = (heard: string[]) => heard.filter(line => / lanes?, in five\.$/.test(line));

describe('LastShuttleOutEncounter', () => {
    it('has the station to port of the player ship, in a faction of its own, with nothing else there yet', () => {
        const { state, ship } = createEvacuation();

        expect(state.encounter!.objective).toEqual({ type: 'protect', subject: 'the shuttles' });

        const corrie = state.getObjectByScenarioId(stationScenarioId) as AiShip;
        expect(corrie.name).toBe(station);
        expect(corrie.getPosition(state.currentTime)).toEqual({ x: 0, y: -stationOffset, angle: 0 });
        expect(corrie.hullState.maxHealth).toBe(30);
        expect(state.factionRegistry.getRelationship(corrie, ship)).toBe(RelationshipType.Friendly);
        expect([...state.objects.values()].filter(object => object !== ship && object !== corrie)).toEqual([]);
    });

    it('opens with the station saying how it works, and keeps Extend Shields in the engineer\'s hand', () => {
        const { state, ship } = createEvacuation();

        expect(state.hail).toMatchObject({ speaker: station });
        expect(state.hail!.text).toContain('Some of it still has a gun, and from here they look the same. Your sensors can tell.');
        expect(ship.engineerState.hand.some(card => card.type === 'extendShields')).toBe(true);
    });

    it('lets the briefing be read before the first launch is called', () => {
        const evacuation = createEvacuation();
        const briefing = evacuation.state.hail!;

        const heard = hearUntil(evacuation, firstLaunchMs / 1000);

        expect(launchCalls(heard)[0]).toMatch(/^15: Shuttle One, /);
        // The briefing was still up until then, so it wasn't cut short.
        expect(heard[0]).toMatch(/^15: /);
        expect(briefing.text.length).toBeGreaterThan(100);
    });

    it.each([3, 7, 11])('launches six shuttles on schedule, each called five seconds ahead, never down the same lane twice running (seed %i)', (seed) => {
        const evacuation = createEvacuation({ seed });
        const { state } = evacuation;
        const launches: number[] = [];
        const seen = new Set<string>();

        const heard: string[] = [];
        while (evacuation.elapsed() < 240) {
            heard.push(...hearUntil(evacuation, evacuation.elapsed() + 0.1));
            for (const shuttle of named(state, 'Shuttle')) {
                if (!seen.has(shuttle.id)) {
                    seen.add(shuttle.id);
                    launches.push(Math.round(evacuation.elapsed()));
                }
            }
        }

        const calls = launchCalls(heard);
        const expected = [0, 1, 2, 3, 4, 5].map(index => firstLaunchMs / 1000 + index * launchIntervalMs / 1000);
        expect(launches).toEqual(expected);
        expect(calls.map(line => Number(line.split(':')[0]))).toEqual(expected.map(at => at - launchWarningMs / 1000));
        expect(calls.map(line => line.split(', ')[0].split(': ')[1])).toEqual(['Shuttle One', 'Shuttle Two', 'Shuttle Three', 'Shuttle Four', 'Shuttle Five', 'Shuttle Six']);

        const laneNames = calls.map(line => line.split(', ')[1].replace(' lane', ''));
        for (let i = 1; i < laneNames.length; i++) {
            expect(laneNames[i]).not.toBe(laneNames[i - 1]);
        }
        expect(new Set(laneNames).size).toBeGreaterThan(1);
    });

    it('launches each shuttle from the station, facing down its lane, to fly to the end of it', () => {
        const evacuation = createEvacuation();
        const { state, encounter } = evacuation;

        const heard = hearUntil(evacuation, firstLaunchMs / 1000);
        const laneName = heard.at(-1)!.split(', ')[1].replace(' lane', '');
        const shuttle = shuttleNamed(state, 'One');
        const lane = encounter.getLane(lanes.find(candidate => candidate.name === laneName)!);

        expect(shuttle.getPosition(state.currentTime)).toEqual({ x: 0, y: -stationOffset, angle: lane.bearing });
        expect(distance(lane.start, lane.end)).toBeCloseTo(laneLength);
        expect(shuttle.ai.blackboard.goal).toBe('travel-route');
        letCommanderNotice(state, shuttle);
        expect(shuttle.ai.blackboard.destination).toEqual(lane.end);
        expect(state.factionRegistry.getRelationship(shuttle, evacuation.ship)).toBe(RelationshipType.Friendly);
    });

    it('sends each wave\'s stated number of fragments with each shuttle, and the stated number of them live, all from either side of its lane', () => {
        const evacuation = createEvacuation();
        const { state, encounter } = evacuation;
        let before = 0;

        for (let wave = 0; wave < 6; wave++) {
            hearUntil(evacuation, (firstLaunchMs + wave * launchIntervalMs) / 1000);
            const fragments = named(state, 'Fragment').slice(before);
            before += fragments.length;

            expect(fragments).toHaveLength(fragmentWaves[wave]);
            expect(fragments.filter(fragment => encounter.isLive(fragment))).toHaveLength(liveInWave[wave]);

            const shuttle = named(state, 'Shuttle').at(-1)!;
            const laneMiddle = { x: 0, y: -stationOffset };
            const angle = shuttle.getPosition(state.currentTime).angle;
            laneMiddle.x += Math.cos(angle) * laneLength / 2;
            laneMiddle.y -= Math.sin(angle) * laneLength / 2;

            for (const fragment of fragments) {
                expect(distance(fragment.getPosition(state.currentTime), laneMiddle)).toBeCloseTo(fragmentSpawnDistance);
                expect(fragment.ai.blackboard.goal).toBe(encounter.isLive(fragment) ? 'search-and-destroy' : 'travel-route');
            }
        }
    });

    it('names the fragments in the order they arrive, all alike, live or dead', () => {
        const evacuation = createEvacuation();
        hearUntil(evacuation, (firstLaunchMs + launchIntervalMs) / 1000);

        const fragments = named(evacuation.state, 'Fragment');
        expect(fragments.map(fragment => fragment.name)).toEqual(['Fragment One', 'Fragment Two', 'Fragment Three', 'Fragment Four', 'Fragment Five', 'Fragment Six']);
        expect(new Set(fragments.map(fragment => fragment.appearance)).size).toBe(1);
        expect(new Set(fragments.map(fragment => fragment.faction)).size).toBe(1);
    });

    it('has the grid hostile to the shuttles, and not to the crew, who can still fire on it', () => {
        const evacuation = createEvacuation();
        const { state, ship } = evacuation;
        hearUntil(evacuation, firstLaunchMs / 1000);

        const [fragment] = named(state, 'Fragment');
        expect(state.factionRegistry.areHostile(fragment, shuttleNamed(state, 'One'))).toBe(true);
        expect(state.factionRegistry.getRelationship(fragment, ship)).toBe(RelationshipType.Neutral);
        expect(state.factionRegistry.getRelationship(fragment, state.getObjectByScenarioId(stationScenarioId)!)).toBe(RelationshipType.Neutral);
    });

    describe('a shuttle', () => {
        it('that reaches the end of its lane jumps away, and the station counts it', () => {
            const evacuation = createEvacuation();
            const { state, encounter } = evacuation;
            hearUntil(evacuation, firstLaunchMs / 1000 + 10);
            const shuttle = shuttleNamed(state, 'One');

            arrive(evacuation, shuttle);

            expect(state.objects.has(shuttle.id)).toBe(false);
            expect(encounter.saved).toBe(1);
            expect(hearFromNow(evacuation, evacuation.elapsed() + 10)).toContainEqual(expect.stringMatching(/: One's away\.$/));
            expect(state.encounter!.outcome).toBeNull();
        });

        it('that is destroyed is lost, and the station says so', () => {
            const evacuation = createEvacuation();
            const { state, encounter } = evacuation;
            hearUntil(evacuation, firstLaunchMs / 1000 + 10);

            shuttleNamed(state, 'One').destroy();

            expect(encounter.lost).toBe(1);
            expect(hearFromNow(evacuation, evacuation.elapsed() + 10)).toContainEqual(expect.stringMatching(/: We've lost One\.$/));
        });

        it('survives one cannon hit on its own, and not a second', () => {
            const evacuation = createEvacuation();
            const { state } = evacuation;
            hearUntil(evacuation, firstLaunchMs / 1000);
            const shuttle = shuttleNamed(state, 'One');
            expect(shuttle.hullState.maxShield).toBe(15);
            expect(shuttle.hullState.maxHealth).toBe(4);

            // Unaimed, onto its hull: what gets past its shields is two cards of its four.
            shuttle.damage({ amount: 20, traits: ['energyWeapon'], targetSystem: 'hull' });
            expect(shuttle.hullState.health).toBe(2);
            expect(state.objects.has(shuttle.id)).toBe(true);

            shuttle.damage({ amount: 20, traits: ['energyWeapon'], targetSystem: 'helm' });
            expect(state.objects.has(shuttle.id)).toBe(false);
        });

        it('under the crew\'s extended shields takes nothing to its hull, and each hit costs the crew about 13 of their 120', () => {
            const evacuation = createEvacuation();
            const { state, ship } = evacuation;
            hearUntil(evacuation, firstLaunchMs / 1000);
            const shuttle = shuttleNamed(state, 'One');
            const at = shuttle.getPosition(state.currentTime);
            place(state, ship, at.x - 3, at.y);

            const extend = ship.engineerState.hand.find(card => card.type === 'extendShields')!;
            expect(ship.engineerState.playCard(extend.id, 'extendShields', 'no-target', '')).not.toBeNull();

            for (let hit = 1; hit <= 3; hit++) {
                const crewBefore = ship.hullState.shield;
                const shuttleBefore = shuttle.hullState.shield;
                shuttle.damage({ amount: 20, traits: ['energyWeapon'], targetSystem: 'helm' });

                // Reinforced shields, as an emitter leaves them, drain by three quarters as much.
                expect(crewBefore - ship.hullState.shield).toBeGreaterThanOrEqual(10);
                expect(crewBefore - ship.hullState.shield).toBeLessThanOrEqual(13);
                expect(shuttleBefore - shuttle.hullState.shield).toBeLessThanOrEqual(3);
            }

            expect(shuttle.hullState.health).toBe(4);
            expect(shuttle.helmState.health).toBe(shuttle.helmState.maxHealth);
        });
    });

    it('has a fragment destroyed by one torpedo, or by two cannon hits', () => {
        const evacuation = createEvacuation();
        const { state } = evacuation;
        hearUntil(evacuation, firstLaunchMs / 1000);
        const [first, second] = named(state, 'Fragment');

        first.damage({ amount: 40, traits: ['torpedoWeapon'], targetSystem: 'tactical' });
        expect(state.objects.has(first.id)).toBe(false);

        second.damage({ amount: 20, traits: ['energyWeapon'], targetSystem: 'tactical' });
        expect(state.objects.has(second.id)).toBe(true);
        second.damage({ amount: 20, traits: ['energyWeapon'], targetSystem: 'tactical' });
        expect(state.objects.has(second.id)).toBe(false);
    });

    it('has a dead fragment leave once it has drifted across its lane and out the other side', () => {
        const evacuation = createEvacuation();
        const { state, encounter } = evacuation;
        hearUntil(evacuation, firstLaunchMs / 1000);
        const dead = named(state, 'Fragment').find(fragment => !encounter.isLive(fragment))!;
        const live = named(state, 'Fragment').find(fragment => encounter.isLive(fragment))!;

        // Every waypoint of its drift, one after another.
        for (let leg = 0; leg < 5; leg++) {
            flyLeg(state, dead);
        }
        expect(dead.ai.commander.isRouteComplete).toBe(true);
        evacuation.campaign.tick(0);

        expect(state.objects.has(dead.id)).toBe(false);
        expect(state.objects.has(live.id)).toBe(true);
    });

    describe('grading', () => {
        /** Has the shuttles launch, and the given ones get away, while the rest are destroyed. */
        function evacuate(evacuation: Evacuation, saved: readonly number[]) {
            const names = ['One', 'Two', 'Three', 'Four', 'Five', 'Six'];
            const heard: string[] = [];

            names.forEach((name, index) => {
                heard.push(...hearUntil(evacuation, (firstLaunchMs + index * launchIntervalMs) / 1000 + 1));
                const shuttle = shuttleNamed(evacuation.state, name);
                if (saved.includes(index)) {
                    arrive(evacuation, shuttle);
                } else {
                    shuttle.destroy();
                }
                heard.push(...hearFromNow(evacuation, evacuation.elapsed() + 0.1));
            });

            heard.push(...hearUntil(evacuation, evacuation.elapsed() + 20));
            return heard;
        }

        it('pays half the reward for three saved, and the station says how many', () => {
            const evacuation = createEvacuation();

            const heard = evacuate(evacuation, [0, 2, 5]);

            expect(evacuation.state.encounter!.outcome).toBe('success');
            expect(evacuation.encounter.score).toBe(0.5);
            expect(evacuation.ship.antimatter).toBe(antimatterRewards.combat / 2);
            expect(heard.at(-1)).toMatch(/: Three away\. That's three more than we'd have managed\. Go\.$/);
            expect(heard.filter(line => line.includes('away.'))).toEqual(expect.arrayContaining([expect.stringMatching(/One's away/), expect.stringMatching(/Three's away/)]));
            expect(heard.some(line => line.includes('Six\'s away'))).toBe(false);
        });

        it('pays in full for all six', () => {
            const evacuation = createEvacuation();

            const heard = evacuate(evacuation, [0, 1, 2, 3, 4, 5]);

            expect(evacuation.state.encounter!.outcome).toBe('success');
            expect(evacuation.ship.antimatter).toBe(antimatterRewards.combat);
            expect(heard.at(-1)).toMatch(/: All six\. Every one of them\. Now go, before she blows\.$/);
        });

        it('is a failure with none saved: nothing said at the end, no reward, and the run carries on', () => {
            const evacuation = createEvacuation();

            const heard = evacuate(evacuation, []);

            expect(evacuation.state.encounter!.outcome).toBe('failure');
            expect(evacuation.ship.antimatter).toBe(0);
            expect(heard.some(line => line.includes('lost Six'))).toBe(false);
            expect(evacuation.state.hail).toBeNull();
            expect(evacuation.campaign.warpAway(evacuation.ship)).toBe(true);
            expect(evacuation.state.phase).toBe('map');
        });

        it('leaves live fragments where they are once it\'s over', () => {
            const evacuation = createEvacuation();
            evacuate(evacuation, [0]);
            const live = named(evacuation.state, 'Fragment').filter(fragment => evacuation.encounter.isLive(fragment));

            expect(live.length).toBeGreaterThan(0);
            for (const fragment of live) {
                expect(fragment.ai.commander.isWithdrawing).toBe(false);
            }
        });
    });

    describe('the station\'s question', () => {
        const askedAt = (firstLaunchMs + 3 * launchIntervalMs + questionDelayMs) / 1000;

        it('is asked after the fourth launch', () => {
            const evacuation = createEvacuation();

            hearUntil(evacuation, askedAt - 0.1);
            expect(evacuation.state.prompt).toBeNull();
            hearUntil(evacuation, askedAt);
            expect(evacuation.state.prompt).toMatchObject({ speaker: station });
            expect(evacuation.state.prompt!.text).toContain('I can send Five and Six together, right now');
        });

        it('sends Five and Six together five seconds later, called at once, down different lanes, if asked to', () => {
            const evacuation = createEvacuation();
            const { state, campaign } = evacuation;
            hearUntil(evacuation, askedAt + 2);

            expect(campaign.activeEncounter!.answerPrompt(scheduleAnswers.sendBoth)).toBe(true);
            const answeredAt = evacuation.elapsed();
            const heard = hearUntil(evacuation, answeredAt + sendBothDelayMs / 1000 + 0.1);

            expect(launchCalls(heard)).toEqual([expect.stringMatching(/^\d+: Shuttles Five and Six, (\w+) and (?!\1)\w+ lanes, in five\.$/)]);
            const five = shuttleNamed(state, 'Five');
            const six = shuttleNamed(state, 'Six');
            expect(five).toBeDefined();
            expect(six).toBeDefined();
            expect(five.getPosition(state.currentTime).angle).not.toBe(six.getPosition(state.currentTime).angle);
            expect(named(state, 'Fragment')).toHaveLength(fragmentWaves.reduce((sum, count) => sum + count, 0));

            // Nothing more is launched on the old schedule.
            hearUntil(evacuation, 240);
            expect(named(state, 'Shuttle')).toHaveLength(6);
        });

        it.each([['holds the schedule if asked to', scheduleAnswers.hold], ['holds the schedule if nobody answers', null]])('%s', (_, answer) => {
            const evacuation = createEvacuation();
            const { state, campaign } = evacuation;
            hearUntil(evacuation, askedAt + 2);

            if (answer) {
                campaign.activeEncounter!.answerPrompt(answer);
            } else {
                hearUntil(evacuation, askedAt + questionTimeoutMs / 1000 - 0.1);
                expect(state.prompt).not.toBeNull();
            }
            const heard = hearUntil(evacuation, (firstLaunchMs + 5 * launchIntervalMs) / 1000);

            expect(state.prompt).toBeNull();
            expect(launchCalls(heard).map(line => line.split(',')[0])).toEqual(['175: Shuttle Five', '215: Shuttle Six']);
        });

        it('isn\'t asked in the elite form', () => {
            const evacuation = createEvacuation({ elite: true });
            hearUntil(evacuation, askedAt + 1);

            expect(evacuation.state.prompt?.text ?? '').not.toContain('Five and Six together');
        });
    });

    describe('elite', () => {
        const askedAt = (firstLaunchMs + 2 * launchIntervalMs + questionDelayMs) / 1000;

        it('has the station ask, after the third launch, whether to launch the rest cold', () => {
            const evacuation = createEvacuation({ elite: true });

            hearUntil(evacuation, askedAt);

            expect(evacuation.state.prompt).toMatchObject({ speaker: station });
            expect(evacuation.state.prompt!.text).toContain('launch every twenty-five seconds');
            expect(evacuation.state.prompt!.options.map(option => option.id)).toEqual([coldAnswers.cold, coldAnswers.keepChecks]);
        });

        it.each([['keeps the checks if asked to', coldAnswers.keepChecks], ['keeps the checks if nobody answers', null]])('%s: Six is never launched, as the reactor fails first', (_, answer) => {
            const evacuation = createEvacuation({ elite: true });
            const { state, encounter } = evacuation;
            hearUntil(evacuation, askedAt + 1);
            if (answer) {
                evacuation.campaign.activeEncounter!.answerPrompt(answer);
            }

            const heard = hearUntil(evacuation, reactorFailsAtMs / 1000 + 5);

            expect(launchCalls(heard).map(line => line.split(',')[0])).toEqual(['135: Shuttle Four', '175: Shuttle Five']);
            expect(heard).toContainEqual(expect.stringMatching(/^210: Reactor's gone\. Six won't be launching\.$/));
            expect(named(state, 'Shuttle Six')).toEqual([]);
            expect(encounter.lost).toBe(1);

            hearUntil(evacuation, 260);
            expect(named(state, 'Shuttle Six')).toEqual([]);
        });

        it('launches Four, Five and Six every 25 seconds with their shields down, if told to launch them cold', () => {
            const evacuation = createEvacuation({ elite: true });
            const { state } = evacuation;
            hearUntil(evacuation, askedAt + 1);
            evacuation.campaign.activeEncounter!.answerPrompt(coldAnswers.cold);

            const lastOnSchedule = (firstLaunchMs + 2 * launchIntervalMs) / 1000;
            const heard = hearUntil(evacuation, lastOnSchedule + 3 * coldLaunchIntervalMs / 1000);

            expect(launchCalls(heard).map(line => line.split(',')[0])).toEqual([
                `${lastOnSchedule + 20}: Shuttle Four`, `${lastOnSchedule + 45}: Shuttle Five`, `${lastOnSchedule + 70}: Shuttle Six`,
            ]);
            for (const name of ['Four', 'Five', 'Six']) {
                expect(shuttleNamed(state, name).hullState.shield).toBe(0);
            }
            expect(shuttleNamed(state, 'Three').hullState.shield).toBe(15);

            // Unshielded, one hit is enough.
            const four = shuttleNamed(state, 'Four');
            four.damage({ amount: 20, traits: ['energyWeapon'], targetSystem: 'helm' });
            expect(state.objects.has(four.id)).toBe(false);
        });

        it('has no reactor failure in the regular form', () => {
            const evacuation = createEvacuation();
            const heard = hearUntil(evacuation, reactorFailsAtMs / 1000 + 15);

            expect(heard.some(line => line.includes('Reactor\'s gone'))).toBe(false);
            expect(named(evacuation.state, 'Shuttle Six')).toHaveLength(1);
        });
    });

    describe('played out with the real AI', () => {
        it('has a live fragment load its cannon, which a scan of its tactical system shows, while a dead one\'s slot stays empty for its whole drift', () => {
            const evacuation = createEvacuation();
            const { state, ship, encounter } = evacuation;
            // Out of the way.
            place(state, ship, -60, 0);
            hearUntil(evacuation, firstLaunchMs / 1000);
            const live = named(state, 'Fragment').find(fragment => encounter.isLive(fragment))!;
            const dead = named(state, 'Fragment').filter(fragment => !encounter.isLive(fragment));

            play(state, 5000);
            const science = ship.scienceState;
            science.subscribeToSystem(live, 'tactical');
            expect(science.scannedTactical!.weaponSlots[0].card?.type).toBe('phaserCannon');

            for (let elapsed = 0; elapsed < 120_000 && dead.some(fragment => state.objects.has(fragment.id)); elapsed += 1000) {
                for (const fragment of dead.filter(drifting => state.objects.has(drifting.id))) {
                    science.subscribeToSystem(fragment, 'tactical');
                    expect(science.scannedTactical!.weaponSlots[0].card).toBeNull();
                }
                play(state, 1000);
            }

            // They've drifted across and gone.
            expect(dead.filter(fragment => state.objects.has(fragment.id))).toEqual([]);
        });

        it('has live fragments fire on shuttles, and never on the crew, while dead ones never fire at all', () => {
            const evacuation = createEvacuation({ seed: 4 });
            const { state, ship, encounter } = evacuation;
            const shots: { from: AiShip; at: string | undefined }[] = [];
            const spy = vi.spyOn(state, 'broadcastWeaponEffect').mockImplementation((effect: WeaponEffect) => {
                const from = state.objects.get(effect.sourceId) as AiShip | undefined;
                if (effect.type === 'shot' && from?.name.startsWith('Fragment')) {
                    shots.push({ from, at: effect.targetId });
                }
            });

            // The crew sits by the station, where every shuttle passes.
            place(state, ship, 2, -8);
            play(state, (firstLaunchMs + 2 * launchIntervalMs) - 100);
            spy.mockRestore();

            expect(shots.length).toBeGreaterThan(0);
            for (const { from, at } of shots) {
                expect(encounter.isLive(from)).toBe(true);
                expect(at).not.toBe(ship.id);
            }
            expect(encounter.lost).toBeGreaterThan(0);
        });

        it('has a live fragment whose shuttle has gone go after the next one', () => {
            const evacuation = createEvacuation();
            const { state, encounter } = evacuation;
            hearUntil(evacuation, firstLaunchMs / 1000);
            const live = named(state, 'Fragment').find(fragment => encounter.isLive(fragment))!;

            arrive(evacuation, shuttleNamed(state, 'One'));
            letCommanderNotice(state, live);
            expect(live.ai.blackboard.targetId).toBeNull();

            hearUntil(evacuation, (firstLaunchMs + launchIntervalMs) / 1000);
            // It needs to have seen it, which takes a tick of the game.
            play(state, 1000);
            letCommanderNotice(state, live);
            expect(live.ai.blackboard.targetId).toBe(shuttleNamed(state, 'Two').id);
        });
    });
});

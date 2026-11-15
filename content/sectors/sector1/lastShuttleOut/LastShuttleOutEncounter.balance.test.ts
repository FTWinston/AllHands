import { appendFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { MotionKeyframe } from 'engine/state/MotionKeyframe';
import { seededRandom, setupGameRoom, startCampaign } from 'engine/testUtils';
import { describe, expect, it } from 'vitest';
import { coldAnswers, firstLaunchMs, launchIntervalMs, scheduleAnswers, type LastShuttleOutEncounter } from './LastShuttleOutEncounter.engine';
import type { AiShip } from 'engine/state/AiShip';
import type { GameObject } from 'engine/state/GameObject';

const rooms = setupGameRoom();

/** Vitest hides what passing tests print, so each run's numbers go to a file, for writing down. */
const log = (line: string) => appendFileSync(join(tmpdir(), 'lastShuttleOut.balance.txt'), `${line}\n`);

const seeds = [3, 7, 11, 13, 17];

/** The player ship's shields at the start. They don't come back. */
const fullShield = 120;

/** When Shuttle Six launches, on the schedule. */
const sixLaunchesMs = firstLaunchMs + 5 * launchIntervalMs;

/** A campaign running Last Shuttle Out, and what the crew's science has found out about the fragments. */
function createEvacuation(seed: number, elite = false) {
    const state = rooms.createState(seededRandom(seed));
    const { campaign, ships } = startCampaign(state);
    campaign.devLoadEncounter('lastShuttleOut', elite);

    return {
        state,
        ship: ships[0],
        encounter: campaign.activeEncounter as LastShuttleOutEncounter,
        /** The fragments science has scanned. */
        scanned: new Set<string>(),
        /** Those of them that are live. */
        live: new Set<string>(),
        /** The crew's shields as Shuttle Six launches. */
        shieldAtSix: null as number | null,
    };
}

type Crew = ReturnType<typeof createEvacuation>;
/** Something the crew does, every tenth of a second. */
type Behaviour = (crew: Crew, elapsedMs: number) => void;

const named = ({ state }: Crew, prefix: string) => [...state.objects.values()].filter(object => object.name.startsWith(prefix)) as AiShip[];
const range = ({ state }: Crew, a: GameObject, b: GameObject) => {
    const from = a.getPosition(state.currentTime);
    const to = b.getPosition(state.currentTime);
    return Math.hypot(from.x - to.x, from.y - to.y);
};
const nearestFirst = (crew: Crew, ships: AiShip[]) => ships.sort((a, b) => range(crew, crew.ship, a) - range(crew, crew.ship, b));

/** Plays the encounter out, AI and all, until it's decided. The room's timers aren't otherwise running, so those are moved on as well. */
function run(crew: Crew, ...behaviours: Behaviour[]) {
    const { state, ship, encounter } = crew;
    let elapsed = 0;

    for (; elapsed < 400_000 && state.encounter?.outcome === null; elapsed += 100) {
        for (const behaviour of behaviours) {
            behaviour(crew, elapsed);
        }

        state.tick(100);

        for (const delayed of [...rooms.getClock().delayed]) {
            if (delayed.active) {
                delayed.tick(100);
            }
        }

        if (elapsed === sixLaunchesMs) {
            crew.shieldAtSix = ship.hullState.shield;
        }
    }

    return { seconds: elapsed / 1000, outcome: state.encounter?.outcome, saved: encounter.saved };
}

/**
 * Helm keeps just behind the shuttle launched most recently, and waits by the station between launches.
 * It goes at no more than this speed: Zig-zag and Sweep go at 1 unit a second, Slow and Steady averages 0.75. Steering this well every half second is more than a crew could do.
 */
const follow = (speed: number): Behaviour => (crew, elapsedMs) => {
    if (elapsedMs % 500 !== 0) {
        return;
    }

    const { state, ship } = crew;
    const now = state.currentTime;
    const at = ship.getPosition(now);
    const target = named(crew, 'Shuttle').at(-1)?.getPosition(now) ?? { x: 3, y: -8 };
    const distance = Math.hypot(target.x - at.x, target.y - at.y);
    const step = Math.min(Math.max(0, distance - 1.5), speed / 2);
    const scale = distance > 0 ? step / distance : 0;

    ship.setMotion(new MotionKeyframe(now, at.x, at.y, at.angle), new MotionKeyframe(now + 500, at.x + (target.x - at.x) * scale, at.y + (target.y - at.y) * scale, at.angle));
};

/** The engineer keeps Extend Shields going the whole time. It only covers a shuttle within 4 units. */
const cover: Behaviour = ({ ship }) => {
    const hull = ship.engineerState.systems.find(tile => tile.system === 'hull')!;
    if (!hull.hasEffect('shieldsExtended')) {
        hull.addEffect('shieldsExtended');
    }
};

/**
 * Science finds out whether a fragment is live every so often, nearest first.
 * A fragment's tactical system is one of four scan slots, so finding it takes two or three of science's cards, which come every six seconds or so.
 */
const scan = (everyMs: number): Behaviour => (crew, elapsedMs) => {
    if (elapsedMs === 0 || elapsedMs % everyMs !== 0) {
        return;
    }

    const [next] = nearestFirst(crew, named(crew, 'Fragment').filter(fragment => !crew.scanned.has(fragment.id)));
    if (next) {
        crew.scanned.add(next.id);
        if (crew.encounter.isLive(next)) {
            crew.live.add(next.id);
        }
    }
};

/**
 * Tactical lands a hit on the nearest fragment science has found to be live, aimed at its tactical system, as often as the weapon comes round, and never fires on any other.
 * Every shot hits: this is about what each plan comes to, not about aiming.
 */
function shoot(weapon: 'cannon' | 'torpedo', firstAtMs: number, everyMs: number): Behaviour {
    let nextAt = firstAtMs;
    const { amount, traits, reach } = weapon === 'cannon'
        ? { amount: 20, traits: ['energyWeapon' as const], reach: 10 }
        : { amount: 40, traits: ['torpedoWeapon' as const], reach: 20 };

    return (crew, elapsedMs) => {
        if (elapsedMs < nextAt) {
            return;
        }

        const [target] = nearestFirst(crew, named(crew, 'Fragment').filter(fragment => crew.live.has(fragment.id) && range(crew, crew.ship, fragment) <= reach));
        if (target) {
            target.damage({ amount, traits: [...traits], targetSystem: 'tactical', sourceId: crew.ship.id });
            nextAt = elapsedMs + everyMs;
        }
    };
}

const answer = (id: string): Behaviour => ({ state, encounter }) => {
    if (state.prompt) {
        encounter.answerPrompt(id);
    }
};

/**
 * What the crew's tactical deck can do: its one cannon comes round about once a minute and a quarter, for four shots, and so does its one torpedo.
 * So a cannon hit every 16 seconds from 30 seconds in is about what it manages. Every 8 seconds is twice that.
 */
const killing = (cannonEveryMs = 16_000) => [scan(12_000), shoot('cannon', 30_000, cannonEveryMs), shoot('torpedo', 40_000, 70_000)];

/** Each plan is made afresh for each run, as some of what it does keeps count. */
const plans = {
    nothing: () => [],
    coverOnly: () => [follow(1), cover],
    killOnly: () => [follow(1), ...killing()],
    coverAndKill: () => [follow(1), cover, ...killing()],
    coverAndKillFast: () => [follow(1), cover, ...killing(8000)],
    coverAndKillSendBoth: () => [follow(1), cover, ...killing(), answer(scheduleAnswers.sendBoth)],
    eliteNothing: () => [],
    eliteKeepChecks: () => [follow(1), cover, ...killing()],
    eliteCold: () => [follow(1), cover, ...killing(), answer(coldAnswers.cold)],
} satisfies Record<string, () => Behaviour[]>;

type Plan = keyof typeof plans;

/** What each plan came to on each seed. */
interface Played {
    outcome: string | null | undefined;
    seconds: number;
    saved: number;
    lost: number;
    /** The crew's shields at the end, and as Shuttle Six launched, if it did on schedule. */
    shield: number;
    shieldAtSix: number | null;
}

const playedOut = new Map<Plan, Played[]>();

/** How a plan went on every seed. Each was played in a test of its own, as a test's room can only run one campaign. */
function playOut(plan: Plan): Played[] {
    const played = playedOut.get(plan) ?? [];
    expect(played).toHaveLength(seeds.length);
    return played;
}

const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

const savedIn = (runs: { saved: number }[]) => runs.map(({ saved }) => saved);

/**
 * What a played-out Last Shuttle Out comes to, which says whether it's tuned right, rather than whether it works.
 * Five seeds a plan, so a mean moves by a fifth of a shuttle for each one that goes differently: these are rough.
 */
describe('LastShuttleOutEncounter balance', { timeout: 30_000 }, () => {
    it.each(Object.keys(plans).flatMap(plan => seeds.map(seed => ({ plan: plan as Plan, seed }))))('plays out: $plan, seed $seed', ({ plan, seed }) => {
        const crew = createEvacuation(seed, plan.startsWith('elite'));
        const { outcome, seconds, saved } = run(crew, ...plans[plan]());
        const shield = crew.ship.hullState.shield;

        log(`${plan} seed ${seed}: ${outcome} at ${seconds}s, saved ${saved}, crew shield ${shield} (${crew.shieldAtSix ?? '-'} as Six launched), live fragments found ${crew.live.size}`);
        playedOut.set(plan, [...playedOut.get(plan) ?? [], { outcome, seconds, saved, lost: crew.encounter.lost, shield, shieldAtSix: crew.shieldAtSix }]);
    });

    it('a crew that does nothing saves fewer than three, and is never fired on', () => {
        for (const { outcome, saved, shield } of playOut('nothing')) {
            expect(outcome).not.toBeNull();
            expect(saved).toBeLessThan(3);
            expect(shield).toBe(fullShield);
        }
    });

    it('a crew that only covers, and never fires, has spent nearly all its shields before Six launches, and saves fewer than one that only kills', () => {
        const covering = playOut('coverOnly');
        const killing = playOut('killOnly');

        for (const { saved, shieldAtSix } of covering) {
            expect(shieldAtSix).toBeLessThan(20);
            expect(saved).toBeLessThanOrEqual(3);
        }
        // Out of shields altogether on most seeds.
        expect(covering.filter(({ shieldAtSix }) => shieldAtSix === 0).length).toBeGreaterThanOrEqual(4);
        expect(mean(savedIn(covering))).toBeLessThan(mean(savedIn(killing)));
    });

    it('a crew that only kills the live fragments science finds saves two or more, and spends no shields', () => {
        for (const { saved, shield } of playOut('killOnly')) {
            expect(saved).toBeGreaterThanOrEqual(2);
            expect(shield).toBe(fullShield);
        }
    });

    it('a crew that covers as well saves three or more, but not all six without killing twice as fast', () => {
        const covering = playOut('coverAndKill');

        for (const { saved } of covering) {
            expect(saved).toBeGreaterThanOrEqual(3);
            expect(saved).toBeLessThan(6);
        }
        expect(mean(savedIn(covering))).toBeGreaterThanOrEqual(mean(savedIn(playOut('killOnly'))));
        expect(mean(savedIn(playOut('coverAndKillFast')))).toBeGreaterThanOrEqual(4);
    });

    it('sending Five and Six together saves about as many as holding the schedule, and it\'s over a minute sooner', () => {
        const holding = playOut('coverAndKill');
        const sending = playOut('coverAndKillSendBoth');

        expect(Math.abs(mean(savedIn(holding)) - mean(savedIn(sending)))).toBeLessThanOrEqual(1);
        expect(mean(sending.map(({ seconds }) => seconds))).toBeLessThan(mean(holding.map(({ seconds }) => seconds)) - 30);
    });

    describe('elite', () => {
        it('a crew that does nothing saves fewer than three, and it\'s over when the reactor fails', () => {
            for (const { saved, seconds } of playOut('eliteNothing')) {
                expect(saved).toBeLessThan(3);
                expect(seconds).toBe(210);
            }
        });

        it('keeping the checks never saves more than five, and launching cold saves about as many', () => {
            const keeping = playOut('eliteKeepChecks');
            const cold = playOut('eliteCold');

            for (const { saved } of keeping) {
                expect(saved).toBeLessThanOrEqual(5);
            }
            expect(Math.abs(mean(savedIn(keeping)) - mean(savedIn(cold)))).toBeLessThanOrEqual(1);
        });
    });
});

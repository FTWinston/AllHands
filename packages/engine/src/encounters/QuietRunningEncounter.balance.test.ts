import { appendFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { MotionKeyframe } from 'src/state/MotionKeyframe';
import { seededRandom, setupGameRoom, startCampaign } from 'src/testUtils';
import { describe, expect, it } from 'vitest';
import { allowance, relayDistance, relayScenarioId, ringRadius, signatureOf, sightRange, windowMs, type QuietRunningEncounter } from './QuietRunningEncounter';
import type { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import type { Vector2D } from 'common-data/features/space/types/Vector2D';
import type { AiShip } from 'src/state/AiShip';

const rooms = setupGameRoom();

/** Vitest hides what passing tests print, so each run's numbers go to a file, for writing down. Set QUIET_RUNNING_LOG to choose where. */
const log = (line: string) => appendFileSync(process.env.QUIET_RUNNING_LOG ?? join(tmpdir(), 'quietRunning.balance.txt'), `${line}\n`);

const seeds = [3, 7, 11, 13, 17];

function createRun(seed: number, elite = false) {
    const state = rooms.createState(seededRandom(seed));
    const { campaign, ships } = startCampaign(state);
    campaign.devLoadEncounter('quietRunning', elite);
    const encounter = campaign.activeEncounter as QuietRunningEncounter;
    const relay = state.getObjectByScenarioId(relayScenarioId) as AiShip;

    return {
        state,
        ship: ships[0],
        encounter,
        relay,
        /** When the crew was seen, if it was, and how far from the relay it was then. */
        seenAt: null as number | null,
        seenFromRelay: null as number | null,
        /** The most power the crew showed while any picket could see it. */
        peakSignature: 0,
    };
}

type Crew = ReturnType<typeof createRun>;
/** Something the crew does, every tenth of a second. */
type Behaviour = (crew: Crew, elapsedMs: number) => void;

const at = ({ state }: Crew, object: { getPosition(time: number): Vector2D }) => object.getPosition(state.currentTime);

/** The two pickets either side of the gap nearest the crew's straight line in, and the point on that gap's middle line this far from the relay. */
function nearestGap(crew: Crew) {
    const centre = at(crew, crew.relay);
    const pickets = crew.encounter.pickets;
    const bearings = pickets.map((picket) => {
        const { x, y } = at(crew, picket);
        return Math.atan2(-(y - centre.y), x - centre.x);
    });

    // The crew comes in from the relay's port side, bearing pi.
    let best = { left: pickets[0], right: pickets[1], bearing: 0, off: Infinity };
    for (let i = 0; i < pickets.length; i++) {
        const j = (i + 1) % pickets.length;
        let middle = (bearings[i] + bearings[j]) / 2;
        if (Math.abs(bearings[j] - bearings[i]) > Math.PI) {
            middle += Math.PI;
        }
        const off = Math.abs(Math.atan2(Math.sin(middle - Math.PI), Math.cos(middle - Math.PI)));
        if (off < best.off) {
            best = { left: pickets[i], right: pickets[j], bearing: middle, off };
        }
    }

    const pointAt = (radius: number) => ({ x: centre.x + Math.cos(best.bearing) * radius, y: centre.y - Math.sin(best.bearing) * radius });
    return { ...best, pointAt };
}

/**
 * Helm flies at this speed towards a point, a half-second keyframe at a time, as close to the cards as a script can be:
 * Zig-zag and Sweep go forward at 1 unit a second, and Slow and Steady averages 0.75. Holding a line this well is more than a crew could do.
 */
function steer(crew: Crew, target: Vector2D, speed: number, elapsedMs: number) {
    if (elapsedMs % 500 !== 0) {
        return;
    }

    const { state, ship } = crew;
    const now = state.currentTime;
    const from = ship.getPosition(now);
    const length = Math.hypot(target.x - from.x, target.y - from.y);
    const step = Math.min(length, speed / 2);
    const scale = length > 0 ? step / length : 0;
    const angle = Math.atan2(-(target.y - from.y), target.x - from.x);

    ship.setMotion(new MotionKeyframe(now, from.x, from.y, angle), new MotionKeyframe(now + 500, from.x + (target.x - from.x) * scale, from.y + (target.y - from.y) * scale, angle));
}

/** Straight at the relay, the whole way. */
const flyStraight = (speed: number): Behaviour => (crew, elapsedMs) => steer(crew, at(crew, crew.relay), speed, elapsedMs);

/** To the middle line of the gap nearest the straight line in, outside every picket's sight, then in along it to the relay. */
const flyGap = (speed: number, waitUntil: (crew: Crew) => boolean = () => true): Behaviour => {
    let committed = false;
    return (crew, elapsedMs) => {
        const gap = nearestGap(crew);
        const holding = gap.pointAt(ringRadius + sightRange - 4);
        const { x, y } = at(crew, crew.ship);
        const nearHolding = Math.hypot(holding.x - x, holding.y - y) < 1;

        if (!committed && nearHolding && waitUntil(crew)) {
            committed = true;
        }

        steer(crew, committed ? at(crew, crew.relay) : holding, speed, elapsedMs);
    };
};

/** The engineer runs these systems quiet from the start. */
const runQuiet = (...systems: ShipSystem[]): Behaviour => {
    let done = false;
    return ({ ship }) => {
        if (done) {
            return;
        }
        done = true;
        for (const system of systems) {
            ship.engineerState.systems.find(tile => tile.system === system)!.addEffect('runningQuiet');
        }
    };
};

/** Science watches the gap's two pickets, and the crew goes in once both are at or below this. A script that sees both at once is better than science can do. */
const bothAtMost = (level: number) => (crew: Crew) => {
    const gap = nearestGap(crew);
    return crew.encounter.sensorLevel(gap.left) <= level && crew.encounter.sensorLevel(gap.right) <= level;
};

/** Through the elite form's defector's place in the ring, then in to the relay. Only someone who knew which it was would do this. */
const flyThroughDefector = (speed: number): Behaviour => {
    let committed = false;
    return (crew, elapsedMs) => {
        const centre = at(crew, crew.relay);
        const defector = at(crew, crew.encounter.defector!);
        const out = { x: defector.x - centre.x, y: defector.y - centre.y };
        const scale = (ringRadius + sightRange - 4) / ringRadius;
        const holding = { x: centre.x + out.x * scale, y: centre.y + out.y * scale };
        const { x, y } = at(crew, crew.ship);

        committed ||= Math.hypot(holding.x - x, holding.y - y) < 1;
        steer(crew, committed ? centre : holding, speed, elapsedMs);
    };
};

/** Tactical launches the flare it's given as soon as any picket could see the ship, and the second as the first goes out. */
const flares: Behaviour = ({ state, ship, encounter }) => {
    const position = ship.getPosition(state.currentTime);
    const inSight = encounter.pickets.some((picket) => {
        const { x, y } = picket.getPosition(state.currentTime);
        return Math.hypot(x - position.x, y - position.y) <= sightRange;
    });
    const card = ship.tacticalState.hand.find(held => held.type === 'flare');

    if (inSight && card && !encounter.isFlareBurning) {
        ship.tacticalState.playCard(card.id, 'flare', 'no-target', '');
    }
};

/** Plays the encounter out, AI and all, until it's decided. The room's timers aren't otherwise running, so those are moved on as well. */
function run(crew: Crew, ...behaviours: Behaviour[]) {
    const { state, ship, encounter } = crew;
    const pickets = encounter.pickets;
    let elapsed = 0;
    /** For each gap, whether both its pickets were at 1 on the last tick, and how many times that's begun. */
    const wasLow = pickets.map(() => false);
    const lowWindows = pickets.map(() => 0);
    const nearest = nearestGap(crew).left;
    let minShield = ship.hullState.shield;

    for (; elapsed < windowMs + 10_000 && state.encounter?.outcome === null; elapsed += 100) {
        for (const behaviour of behaviours) {
            behaviour(crew, elapsed);
        }

        state.tick(100);

        for (const delayed of [...rooms.getClock().delayed]) {
            if (delayed.active) {
                delayed.tick(100);
            }
        }

        if (!state.encounter) {
            break;
        }

        minShield = Math.min(minShield, ship.hullState.shield);

        if (crew.seenAt === null && encounter.isSeen) {
            crew.seenAt = elapsed / 1000;
            crew.seenFromRelay = Math.round(Math.hypot(at(crew, ship).x - at(crew, crew.relay).x, at(crew, ship).y - at(crew, crew.relay).y));
        }

        pickets.forEach((picket, index) => {
            const next = pickets[(index + 1) % pickets.length];
            const low = encounter.sensorLevel(picket) === 1 && encounter.sensorLevel(next) === 1;
            if (low && !wasLow[index]) {
                lowWindows[index]++;
            }
            wasLow[index] = low;
        });

        const position = ship.getPosition(state.currentTime);
        if (pickets.some(picket => Math.hypot(at(crew, picket).x - position.x, at(crew, picket).y - position.y) <= sightRange)) {
            crew.peakSignature = Math.max(crew.peakSignature, signatureOf(ship));
        }
    }

    const destroyed = state.encounter === null;
    return {
        outcome: destroyed ? 'destroyed' : state.encounter!.outcome,
        seconds: elapsed / 1000,
        seenAt: crew.seenAt,
        seenFromRelay: crew.seenFromRelay,
        minShield: destroyed ? 0 : minShield,
        hull: destroyed ? 0 : ship.hullState.health,
        peakSignature: crew.peakSignature,
        /** How many times both pickets of the gap nearest the straight line in were at 1 together, and the most for any gap. */
        lowWindowsNearest: lowWindows[pickets.indexOf(nearest)],
        lowWindowsBest: Math.max(...lowWindows),
    };
}

const everythingBut = (...kept: ShipSystem[]) => runQuiet(...(['hull', 'reactor', 'helm', 'science', 'tactical', 'engineer'] as const).filter(system => !kept.includes(system)));

/** Each plan is made afresh for each run, as some of what it does keeps count. */
const plans = {
    nothing: () => [],
    waitOutside: () => [flyGap(1, () => false)],
    fullPowerStraight: () => [flyStraight(1)],
    fullPowerGap: () => [flyGap(1)],
    fullPowerGapWithFlares: () => [flyGap(1), flares],
    darkButHelmStraight: () => [everythingBut('helm'), flyStraight(1)],
    darkButHelmGap: () => [everythingBut('helm'), flyGap(1)],
    allDarkStraight: () => [everythingBut(), flyStraight(0.75)],
    allDarkGap: () => [everythingBut(), flyGap(0.75)],
    threeDarkWaitForThrees: () => [runQuiet('tactical', 'science', 'hull'), flyGap(1, bothAtMost(3))],
    oneDarkWaitForOnes: () => [runQuiet('tactical'), flyGap(1, bothAtMost(1))],
} satisfies Record<string, () => Behaviour[]>;

const elitePlans = {
    eliteNothing: () => [],
    eliteDarkButHelmGap: () => [everythingBut('helm'), flyGap(1)],
    eliteAllDarkGap: () => [everythingBut(), flyGap(0.75)],
    eliteFullPowerThroughDefector: () => [flyThroughDefector(1)],
    eliteThreeDarkThroughDefector: () => [runQuiet('tactical', 'science', 'reactor'), flyThroughDefector(1)],
} satisfies Record<string, () => Behaviour[]>;

type Plan = keyof typeof plans | keyof typeof elitePlans;
type Played = ReturnType<typeof run>;

const playedOut = new Map<Plan, Played[]>();

/** How a plan went on every seed. Each was played in a test of its own, as a test's room can only run one campaign. */
function playOut(plan: Plan): Played[] {
    const played = playedOut.get(plan) ?? [];
    expect(played).toHaveLength(seeds.length);
    return played;
}

const count = (runs: Played[], outcome: string) => runs.filter(played => played.outcome === outcome).length;

describe('Quiet Running, played out', () => {
    describe.each([
        ...Object.entries(plans).map(([plan, behaviours]) => [plan, false, behaviours] as const),
        ...Object.entries(elitePlans).map(([plan, behaviours]) => [plan, true, behaviours] as const),
    ])('%s', (plan, elite, behaviours) => {
        it.each(seeds)('seed %i', (seed) => {
            const crew = createRun(seed, elite);
            const played = run(crew, ...behaviours());
            log(`${plan} seed ${seed}: ${JSON.stringify(played)}`);
            playedOut.set(plan as Plan, [...(playedOut.get(plan as Plan) ?? []), played]);
        });
    });

    it('lets a crew that does nothing live, and fail when the door closes, unseen', () => {
        for (const plan of ['nothing', 'eliteNothing'] as const) {
            for (const played of playOut(plan)) {
                expect(played).toMatchObject({ outcome: 'failure', seenAt: null, minShield: 120 });
                expect(played.seconds).toBeCloseTo(windowMs / 1000, 0);
            }
        }
    });

    it('sees a crew that flies straight at the relay at full power, which then mostly makes it in', () => {
        const runs = playOut('fullPowerStraight');
        expect(runs.every(played => played.seenAt !== null)).toBe(true);
        expect(count(runs, 'destroyed')).toBeLessThanOrEqual(1);
    });

    it('gives a crew waiting outside the ring both of some gap\'s pickets at 1 at least twice in the window', () => {
        for (const played of playOut('waitOutside')) {
            expect(played.lowWindowsBest).toBeGreaterThanOrEqual(2);
        }
    });

    // The finding: as specified, this is never seen, at any sensor level, so science's reading and the wait are worth nothing.
    it('never sees a crew with everything but helm running quiet, on the middle line of a gap', () => {
        for (const played of playOut('darkButHelmGap')) {
            expect(played).toMatchObject({ outcome: 'success', seenAt: null });
        }
    });

    it('is the relay this far ahead, with this allowance at the middle of a gap', () => {
        expect(relayDistance).toBe(70);
        expect(allowance(14.5, 1)).toBeCloseTo(17.25);
    });
});

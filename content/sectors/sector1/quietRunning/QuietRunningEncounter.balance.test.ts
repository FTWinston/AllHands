import { appendFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { CardState } from 'engine/state/CardState';
import { MotionKeyframe } from 'engine/state/MotionKeyframe';
import { seededRandom, setupGameRoom, startCampaign } from 'engine/testUtils';
import { describe, expect, it } from 'vitest';
import {
    facingArc, highSensor, relayDistance, relayScenarioId, ringRadius, seenScore, sensorCycle, sensorStepMs, sightRange, signatureOf, windowMs,
    type QuietRunningEncounter,
} from './QuietRunningEncounter.engine';
import type { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import type { Vector2D } from 'common-data/features/space/types/Vector2D';
import type { AiShip } from 'engine/state/AiShip';

const rooms = setupGameRoom();

/** Vitest hides what passing tests print, so each run's numbers go to a file, for writing down. Set QUIET_RUNNING_LOG to choose where. */
const log = (line: string) => appendFileSync(process.env.QUIET_RUNNING_LOG ?? join(tmpdir(), 'quietRunning.balance.txt'), `${line}\n`);

const seeds = [3, 7, 11, 13, 17];

const cycleMs = sensorCycle.length * sensorStepMs;
const highMs = sensorStepMs;
/** Out of every picket's sight, all the way round. */
const safeRadius = ringRadius + sightRange + 1;
/** Helm at full power, and with helm running quiet (Slow and Steady). */
const lit = 1;
const dark = 0.75;

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
        /** Perfect science: the game time each picket was last seen going to high. Until then, nothing's known about it. */
        highAt: new Map<AiShip, number>(),
        lastLevel: new Map<AiShip, number>(),
        flaredAt: null as number | null,
        /** The gap the crew went for, how far round from the straight line in it was, and how far apart its pickets' cycles were. */
        gap: null as string | null,
        chosenAt: null as number | null,
        heldAt: null as number | null,
        wentAt: null as number | null,
        startedAt: state.currentTime,
    };
}

type Crew = ReturnType<typeof createRun>;
/** Something the crew does, every tenth of a second. */
type Behaviour = (crew: Crew, elapsedMs: number) => void;
type Gap = { left: AiShip; right: AiShip };

const at = ({ state }: Crew, object: { getPosition(time: number): Vector2D }) => object.getPosition(state.currentTime);
const angleBetween = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
const bearingFromRelay = (crew: Crew, { x, y }: Vector2D) => {
    const centre = at(crew, crew.relay);
    return Math.atan2(-(y - centre.y), x - centre.x);
};
const pointAt = (crew: Crew, bearing: number, radius: number) => {
    const centre = at(crew, crew.relay);
    return { x: centre.x + Math.cos(bearing) * radius, y: centre.y - Math.sin(bearing) * radius };
};

/** Every gap, in order round the ring, each with its middle's bearing from the relay, and where on its middle line sight begins and ends. */
function gapsOf(crew: Crew) {
    const pickets = crew.encounter.pickets;
    return pickets.map((left, index) => {
        const right = pickets[(index + 1) % pickets.length];
        const a = at(crew, left);
        const b = at(crew, right);
        const middle = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const centre = at(crew, crew.relay);
        const along = Math.hypot(middle.x - centre.x, middle.y - centre.y);
        const half = Math.sqrt(sightRange ** 2 - (Math.hypot(a.x - b.x, a.y - b.y) / 2) ** 2);
        return { left, right, bearing: bearingFromRelay(crew, middle), outer: along + half, inner: along - half };
    });
}

/** The crew's straight line in comes from the relay's bearing pi. */
const offLine = (bearing: number) => angleBetween(bearing, Math.PI);

/** Where in its cycle a picket is now, counted from when it last went to high, if science has seen that. */
function sinceHigh(crew: Crew, picket: AiShip): number | null {
    if (picket === crew.encounter.defector) {
        return null;
    }
    const highAt = crew.highAt.get(picket);
    return highAt === undefined ? null : ((crew.state.currentTime - highAt) % cycleMs + cycleMs) % cycleMs;
}

const known = (crew: Crew, picket: AiShip) => picket === crew.encounter.defector || crew.highAt.has(picket);
const isHigh = (crew: Crew, picket: AiShip) => (sinceHigh(crew, picket) ?? Infinity) < highMs;
/** How long until a picket next goes to high, 0 if it's there now, or forever for the defector. */
const untilHigh = (crew: Crew, picket: AiShip) => {
    const since = sinceHigh(crew, picket);
    return since === null ? Infinity : since < highMs ? 0 : cycleMs - since;
};

/** How far apart two pickets' cycles are, in ms, once science has seen both go to high. */
function apart(crew: Crew, { left, right }: Gap): number {
    const a = crew.highAt.get(left)!;
    const b = crew.highAt.get(right)!;
    const diff = ((a - b) % cycleMs + cycleMs) % cycleMs;
    return Math.min(diff, cycleMs - diff);
}

function describeGap(crew: Crew, gap: ReturnType<typeof gapsOf>[number], hasDefector: boolean) {
    const read = hasDefector ? 'beside the defector' : crew.highAt.has(gap.left) && crew.highAt.has(gap.right) ? `cycles ${(apart(crew, gap) / 1000).toFixed(1)}s apart` : 'unread';
    return `${Math.round(offLine(gap.bearing) * 180 / Math.PI)}deg off the line, ${read}`;
}

/** Gap choices: null until science knows enough to choose. */
type ChooseGap = (crew: Crew) => ReturnType<typeof gapsOf>[number] | null;

/** Of the gaps facing the crew between two Wardens, the one whose pickets are most nearly in step (or least, if `worst`). */
const stepGap = (worst = false): ChooseGap => (crew) => {
    const defector = crew.encounter.defector;
    const facing = gapsOf(crew).filter(gap => offLine(gap.bearing) <= facingArc && gap.left !== defector && gap.right !== defector);
    if (!facing.every(gap => known(crew, gap.left) && known(crew, gap.right))) {
        return null;
    }
    const sorted = facing.sort((a, b) => apart(crew, a) - apart(crew, b));
    return worst ? sorted[sorted.length - 1] : sorted[0];
};

/** The gap nearest the straight line in. */
const straightGap: ChooseGap = crew => gapsOf(crew).sort((a, b) => offLine(a.bearing) - offLine(b.bearing))[0];

/** Elite: of the two gaps beside the defector, the one nearer the straight line in. Only someone who'd found the defector would choose this. */
const defectorGap: ChooseGap = (crew) => {
    const defector = crew.encounter.defector!;
    return gapsOf(crew).filter(gap => gap.left === defector || gap.right === defector).sort((a, b) => offLine(a.bearing) - offLine(b.bearing))[0];
};

/**
 * The gap facing the crew nearest the straight line in that isn't the one the game put in step, with its pickets' cycles put this far apart.
 * The picket moved is the one that isn't in the in-step gap.
 */
const forcedGap = (apartMs: number): ChooseGap => {
    let forced: ReturnType<typeof gapsOf>[number] | null = null;
    return (crew) => {
        if (!forced) {
            const inStep = crew.encounter.inStepGap!;
            forced = gapsOf(crew)
                .filter(gap => offLine(gap.bearing) <= facingArc && !(gap.left === inStep[0] && gap.right === inStep[1]))
                .sort((a, b) => offLine(a.bearing) - offLine(b.bearing))[0];
            const moved = inStep.includes(forced.right) ? forced.left : forced.right;
            if (moved === forced.left) {
                crew.encounter.putInStep(forced.left, forced.right, -apartMs);
            } else {
                crew.encounter.putInStep(forced.right, forced.left, apartMs);
            }
            // Its sensors jumped, which isn't a reading.
            crew.lastLevel.delete(moved);
            crew.highAt.delete(moved);
        }
        return known(crew, forced.left) && known(crew, forced.right) ? forced : null;
    };
};

type HeldGap = ReturnType<typeof gapsOf>[number];

/** How long the crossing takes from the holding point, at the speed helm has now. */
const crossingMs = (crew: Crew, gap: HeldGap) => {
    const helmQuiet = crew.ship.engineerState.systems.find(tile => tile.system === 'helm')!.hasEffect('runningQuiet');
    return (gap.outer + 1 - gap.inner) / (helmQuiet ? dark : lit) * 1000;
};
/** How long both pickets of a gap are off high together in each cycle. A gap beside the defector has only the one. */
const windowOf = (crew: Crew, gap: HeldGap) => cycleMs - highMs - (gap.left === crew.encounter.defector || gap.right === crew.encounter.defector ? 0 : apart(crew, gap));
const bothDown = (crew: Crew, { left, right }: Gap) => !isHigh(crew, left) && !isHigh(crew, right);
const timeLeft = (crew: Crew, { left, right }: Gap) => Math.min(untilHigh(crew, left), untilHigh(crew, right));

/** When to go in, from the holding point: once both pickets are off high with time enough left to cross, and a second to spare. */
const withTimeToCross = () => (crew: Crew, gap: HeldGap) => bothDown(crew, gap) && timeLeft(crew, gap) >= crossingMs(crew, gap) + 1000;
/** As both come off high, whether there's time or not. */
const asTheyDrop = () => (crew: Crew, gap: HeldGap) => bothDown(crew, gap) && timeLeft(crew, gap) >= windowOf(crew, gap) - 1000;
/** Mistimed: with this much less time left than the crossing needs. */
const short = (ms: number) => (crew: Crew, gap: HeldGap) => {
    const left = timeLeft(crew, gap) - crossingMs(crew, gap);
    return bothDown(crew, gap) && left < -ms && left >= -ms - 1000;
};

/** Straight away, without reading anything. */
const atOnce = () => () => true;

/**
 * Helm steers at this speed towards a point, a half-second keyframe at a time, as close to the cards as a script can be:
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

const quiet = (crew: Crew, systems: readonly ShipSystem[]) => {
    for (const system of systems) {
        const tile = crew.ship.engineerState.systems.find(candidate => candidate.system === system)!;
        if (!tile.hasEffect('runningQuiet')) {
            tile.addEffect('runningQuiet');
        }
    }
};
const allSystems = ['hull', 'reactor', 'helm', 'science', 'tactical', 'engineer'] as const;
const allBut = (...kept: ShipSystem[]) => allSystems.filter(system => !kept.includes(system));

/** Straight at the relay, the whole way, with these systems running quiet from the start. */
const flyStraight = (speed: number, systems: readonly ShipSystem[] = []): Behaviour => (crew, elapsedMs) => {
    if (!crew.encounter.isSeen) {
        quiet(crew, systems);
    }
    steer(crew, at(crew, crew.relay), speed, elapsedMs);
};

/**
 * Out to where no picket can see, round the ring to the chosen gap as soon as science has chosen it, in along its middle line to just outside sight,
 * and then, with these systems running quiet, in to the relay when `go` says. Helm is at full power until then, and again once the ship's out of sight inside.
 */
function cross(choose: ChooseGap, systems: readonly ShipSystem[], go: (crew: Crew, gap: HeldGap) => boolean): Behaviour {
    let gap: ReturnType<typeof gapsOf>[number] | null = null;
    let committed = false;

    return (crew, elapsedMs) => {
        gap ??= choose(crew);
        if (gap && !crew.gap) {
            crew.gap = describeGap(crew, gap, gap.left === crew.encounter.defector || gap.right === crew.encounter.defector);
            crew.chosenAt = (crew.state.currentTime - crew.startedAt) / 1000;
        }

        const position = at(crew, crew.ship);
        const bearing = bearingFromRelay(crew, position);
        const radius = Math.hypot(position.x - at(crew, crew.relay).x, position.y - at(crew, crew.relay).y);

        if (committed) {
            const helm = crew.ship.engineerState.systems.find(tile => tile.system === 'helm')!;
            if (gap && radius < gap.inner - 0.5 && helm.hasEffect('runningQuiet')) {
                helm.removeEffect('runningQuiet', 'early');
            }
            steer(crew, at(crew, crew.relay), helm.hasEffect('runningQuiet') ? dark : lit, elapsedMs);
            return;
        }

        // Until science has chosen, out of sight on the straight line in.
        const hold = gap ? pointAt(crew, gap.bearing, gap.outer + 1) : pointAt(crew, Math.PI, safeRadius);
        const target = { bearing: gap?.bearing ?? Math.PI };
        const atHold = Math.hypot(hold.x - position.x, hold.y - position.y) < 0.3;

        if (atHold) {
            if (gap) {
                quiet(crew, systems);
                crew.heldAt ??= (crew.state.currentTime - crew.startedAt) / 1000;
                committed = go(crew, gap);
                if (committed) {
                    crew.wentAt = (crew.state.currentTime - crew.startedAt) / 1000;
                }
            }
            return;
        }

        if (angleBetween(bearing, target.bearing) < 0.02) {
            // On the gap's middle line: in to the holding point.
            steer(crew, hold, lit, elapsedMs);
        } else if (radius > safeRadius + 0.5) {
            steer(crew, pointAt(crew, bearing, safeRadius), lit, elapsedMs);
        } else {
            // Round the ring, out of everyone's sight, a step at a time.
            const turn = Math.atan2(Math.sin(target.bearing - bearing), Math.cos(target.bearing - bearing));
            const step = Math.sign(turn) * Math.min(Math.abs(turn), lit / safeRadius);
            steer(crew, pointAt(crew, bearing + step, safeRadius), lit, elapsedMs);
        }
    };
}

/** Tactical launches a flare just before either of the two pickets nearest the ship goes to high, once the ship is in sight. */
const flareBeforeHigh: Behaviour = (crew) => {
    const { state, ship, encounter } = crew;
    const position = at(crew, ship);
    const nearest = [...encounter.pickets].sort((a, b) => Math.hypot(at(crew, a).x - position.x, at(crew, a).y - position.y) - Math.hypot(at(crew, b).x - position.x, at(crew, b).y - position.y)).slice(0, 2);
    const inSight = Math.hypot(at(crew, nearest[0]).x - position.x, at(crew, nearest[0]).y - position.y) <= sightRange;
    const card = ship.tacticalState.hand.find(held => held.type === 'flare');

    if (inSight && card && crew.flaredAt === null && nearest.some(picket => untilHigh(crew, picket) <= 300)) {
        ship.tacticalState.playCard(card.id, 'flare', 'no-target', '');
        crew.flaredAt = state.currentTime;
    }
};

/** Tactical has a second flare, bought, and launches one as the ship comes into sight and the other just before the first goes out. */
const twoFlares: Behaviour = (crew) => {
    const { state, ship, encounter } = crew;
    if (!ship.tacticalState.hand.some(held => held.type === 'flare' && !held.hasTrait('primary')) && crew.flaredAt === null) {
        ship.tacticalState.addCardToHand(new CardState(ship.getCardId(), 'flare'));
    }

    const position = at(crew, ship);
    const inSight = encounter.pickets.some(picket => Math.hypot(at(crew, picket).x - position.x, at(crew, picket).y - position.y) <= sightRange);
    const card = ship.tacticalState.hand.find(held => held.type === 'flare');
    const now = state.currentTime;

    if (card && inSight && (crew.flaredAt === null || now - crew.flaredAt >= 7600)) {
        ship.tacticalState.playCard(card.id, 'flare', 'no-target', '');
        crew.flaredAt = now;
    }
};

/** Plays the encounter out, AI and all, until it's decided. The room's timers aren't otherwise running, so those are moved on as well. */
function run(crew: Crew, ...behaviours: Behaviour[]) {
    const { state, ship, encounter } = crew;
    let elapsed = 0;
    let minShield = ship.hullState.shield;

    for (; elapsed < windowMs + 10_000 && state.encounter?.outcome === null; elapsed += 100) {
        // Science watches every picket at once, which no crew can, until a flare spoils the picture.
        if (crew.flaredAt === null) {
            for (const picket of encounter.pickets) {
                const level = encounter.sensorLevel(picket);
                if (level === highSensor && crew.lastLevel.get(picket) !== highSensor && crew.lastLevel.has(picket)) {
                    crew.highAt.set(picket, state.currentTime);
                }
                crew.lastLevel.set(picket, level);
            }
        }

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

        // Seen, the engineer brings everything back for the run.
        if (encounter.isSeen) {
            for (const tile of ship.engineerState.systems) {
                if (tile.hasEffect('runningQuiet')) {
                    tile.removeEffect('runningQuiet', 'early');
                }
            }
        }

        if (crew.seenAt === null && encounter.isSeen) {
            crew.seenAt = elapsed / 1000;
            crew.seenFromRelay = Math.round(Math.hypot(at(crew, ship).x - at(crew, crew.relay).x, at(crew, ship).y - at(crew, crew.relay).y));
        }
    }

    const destroyed = state.encounter === null;
    return {
        outcome: destroyed ? 'destroyed' : state.encounter!.outcome,
        score: destroyed || state.encounter!.outcome !== 'success' ? 0 : encounter.score,
        seconds: elapsed / 1000,
        seenAt: crew.seenAt,
        seenFromRelay: crew.seenFromRelay,
        minShield: destroyed ? 0 : minShield,
        hull: destroyed ? 0 : ship.hullState.health,
        signature: signatureOf(ship),
        gap: crew.gap,
        chosenAt: crew.chosenAt,
        heldAt: crew.heldAt,
        wentAt: crew.wentAt,
    };
}

/** Each plan is made afresh for each run, as some of what it does keeps count. */
const plans = {
    nothing: () => [],
    fullPowerStraight: () => [flyStraight(lit)],
    helmLitStraight: () => [flyStraight(lit, allBut('helm'))],
    allDarkStraight: () => [flyStraight(dark, allSystems)],
    allDarkInStep: () => [cross(stepGap(), allSystems, withTimeToCross())],
    helmLitInStep: () => [cross(stepGap(), allBut('helm'), withTimeToCross())],
    allDarkInStepLate: () => [cross(stepGap(), allSystems, short(4000))],
    helmLitTight: () => [cross(forcedGap(12_000), allBut('helm'), withTimeToCross())],
    helmLitTightLate: () => [cross(forcedGap(12_000), allBut('helm'), short(4000))],
    allDarkTight: () => [cross(forcedGap(12_000), allSystems, asTheyDrop())],
    flareWorstGap: () => [cross(stepGap(true), allBut('helm', 'tactical'), asTheyDrop()), flareBeforeHigh],
    twoFlaresNoReading: () => [cross(straightGap, [], atOnce()), twoFlares],
} satisfies Record<string, () => Behaviour[]>;

const elitePlans = {
    eliteNothing: () => [],
    eliteFullPowerStraight: () => [flyStraight(lit)],
    eliteHelmLitByDefector: () => [cross(defectorGap, allBut('helm'), withTimeToCross())],
    eliteAllDarkByDefector: () => [cross(defectorGap, allSystems, asTheyDrop())],
    eliteHelmLitInStep: () => [cross(stepGap(), allBut('helm'), withTimeToCross())],
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

const unseenWins = (runs: Played[]) => runs.filter(played => played.outcome === 'success' && played.seenAt === null).length;
const everyTimeUnseen = (plan: Plan) => {
    for (const played of playOut(plan)) {
        expect(played).toMatchObject({ outcome: 'success', score: 1, seenAt: null, minShield: 120 });
        expect(played.seconds).toBeLessThan(windowMs / 1000);
    }
};
/** Seen every time, and worth half wherever it got in. */
const everyTimeSeen = (plan: Plan) => {
    for (const played of playOut(plan)) {
        expect(played.seenAt).not.toBeNull();
        if (played.outcome === 'success') {
            expect(played.score).toBe(seenScore);
        }
    }
};

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

    it('sees a crew that goes straight in without reading anything, however dark, and pays it half for getting in', () => {
        for (const plan of ['fullPowerStraight', 'helmLitStraight', 'allDarkStraight', 'eliteFullPowerStraight'] as const) {
            everyTimeSeen(plan);
        }
        expect(playOut('fullPowerStraight').every(played => played.outcome === 'success')).toBe(true);
    });

    it('lets a crew through the in-step gap unseen every time, all dark or with helm lit, when it goes in with time to cross', () => {
        everyTimeUnseen('allDarkInStep');
        everyTimeUnseen('helmLitInStep');
    });

    it('sees a crew that goes into the in-step gap four seconds too late', () => {
        everyTimeSeen('allDarkInStepLate');
    });

    it('lets a crew through a tight gap only with helm lit, and only on time', () => {
        everyTimeUnseen('helmLitTight');
        everyTimeSeen('allDarkTight');
        everyTimeSeen('helmLitTightLate');
    });

    // The finding: a flare launched as the first of a gap's pickets goes high carries a crew through the worst gap in front of it.
    it('lets a crew with helm and tactical lit through the worst gap in front of it, with its flare', () => {
        everyTimeUnseen('flareWorstGap');
    });

    // Why tactical is given one flare: two, back to back, carry a crew through at full power without reading anything.
    it('lets a crew with a second flare through at full power, reading nothing', () => {
        everyTimeUnseen('twoFlaresNoReading');
    });

    it('lets an elite crew through beside the defector with helm lit, and not with it dark', () => {
        everyTimeUnseen('eliteHelmLitByDefector');
        everyTimeSeen('eliteAllDarkByDefector');
    });

    it('doesn\'t always give an elite crew a gap between two Wardens that it can cross', () => {
        expect(unseenWins(playOut('eliteHelmLitInStep'))).toBeLessThan(seeds.length);
    });

    it('is the relay this far ahead', () => {
        expect(relayDistance).toBe(70);
    });
});

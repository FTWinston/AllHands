import { appendFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { crewRoleNames } from 'common-data/features/ships/types/CrewRole';
import { MotionKeyframe } from 'src/state/MotionKeyframe';
import { seededRandom, setupGameRoom, startCampaign } from 'src/testUtils';
import { describe, expect, it } from 'vitest';
import { gateDistance, type GatePhase, type QuarantineGateEncounter } from './QuarantineGateEncounter';
import type { Vector2D } from 'common-data/features/space/types/Vector2D';
import type { AiShip } from 'src/state/AiShip';

const rooms = setupGameRoom();

/** Vitest hides what passing tests print, so each run's numbers go to a file, for writing down. Set ENCOUNTER_LOG to choose where. */
const log = (line: string) => appendFileSync(process.env.ENCOUNTER_LOG ?? join(tmpdir(), 'quarantineGate.balance.txt'), `${line}\n`);

const seeds = [3, 7, 11, 13, 17];

function createRun(seed: number) {
    const state = rooms.createState(seededRandom(seed));
    const { campaign, ships } = startCampaign(state);
    campaign.devLoadEncounter('quarantineGate');
    const encounter = campaign.activeEncounter as QuarantineGateEncounter;
    const hits: string[] = [];
    ships[0].hitReceived.addListener('balance', ({ damage, passedThrough }) => {
        const source = state.objects.get(damage.sourceId ?? '')?.name ?? '?';
        hits.push(`${Math.round(state.currentTime / 100) / 10}:${source}:${damage.traits.includes('torpedoWeapon') ? 'T' : 'C'}${damage.amount}>${passedThrough}`);
    });

    return {
        hits,
        state,
        ship: ships[0],
        encounter,
        /** The crew's shield as each phase started, and when. */
        phases: [{ phase: 'diagnose' as GatePhase | 'end', atSeconds: 0, shield: ships[0].hullState.shield }],
        boatsLost: 0,
        mastersLost: 0,
    };
}

type Crew = ReturnType<typeof createRun>;
/** Something the crew does, every tenth of a second. */
type Behaviour = (crew: Crew, elapsedMs: number) => void;

const at = ({ state }: Crew, object: { getPosition(time: number): Vector2D }) => object.getPosition(state.currentTime);
const centre: Vector2D = { x: gateDistance, y: 0 };
const alive = (crew: Crew, ship: AiShip | null | undefined): ship is AiShip => !!ship && crew.state.objects.has(ship.id);

/** A point this far from a pylon, on the line from the middle of the square through it: positive is outside the square, negative inside. */
function beside(crew: Crew, pylon: AiShip, offset: number): Vector2D {
    const p = at(crew, pylon);
    const length = Math.hypot(p.x - centre.x, p.y - centre.y);
    return { x: p.x + (p.x - centre.x) / length * offset, y: p.y + (p.y - centre.y) / length * offset };
}

/**
 * Helm flies at this speed towards a point, a half-second keyframe at a time, as close to the cards as a script can be:
 * Zig-zag and Sweep go forward at 1 unit a second, and Slow and Steady averages 0.75.
 */
function steer(crew: Crew, target: Vector2D, speed: number, elapsedMs: number) {
    if (elapsedMs % 500 !== 0) {
        return;
    }

    const now = crew.state.currentTime;
    const from = crew.ship.getPosition(now);
    const gap = Math.hypot(target.x - from.x, target.y - from.y);
    const step = Math.min(gap, speed / 2);
    const scale = gap > 0 ? step / gap : 0;
    crew.ship.setMotion(new MotionKeyframe(now, from.x, from.y, from.angle), new MotionKeyframe(now + 500, from.x + (target.x - from.x) * scale, from.y + (target.y - from.y) * scale, from.angle));
}

/** Where helm wants to be, or null to stay put. */
const fly = (where: (crew: Crew, elapsedMs: number) => Vector2D | null, speed = 1): Behaviour => (crew, elapsedMs) => {
    const target = where(crew, elapsedMs);
    if (target) {
        steer(crew, target, speed, elapsedMs);
    }
};

/**
 * Tactical lands a cannon shot every so often from when it first has one loaded, and a torpedo now and then, on whatever it's after, while that's in reach.
 * Shots always hit. With `chooseType`, it only fires a weapon the target's shields aren't tuned against, as a crew that reads the tuning would.
 */
function shoot(target: (crew: Crew) => AiShip | null | undefined, { cannonEveryMs = 8000, torpedoEveryMs = 60_000, firstAtMs = 30_000, chooseType = false } = {}): Behaviour {
    let nextCannon = firstAtMs;
    let nextTorpedo = firstAtMs + 10_000;

    return (crew, elapsedMs) => {
        const aimed = target(crew);
        if (!alive(crew, aimed)) {
            return;
        }

        const range = Math.hypot(at(crew, crew.ship).x - at(crew, aimed).x, at(crew, crew.ship).y - at(crew, aimed).y);
        const tuning = aimed.engineerState.systems.find(tile => tile.system === 'hull')!;

        if (elapsedMs >= nextCannon && range <= 10 && !(chooseType && tuning.hasEffect('shieldTunedEnergy'))) {
            aimed.damage({ amount: 20, traits: ['energyWeapon'], sourceId: crew.ship.id });
            nextCannon = elapsedMs + cannonEveryMs;
        } else if (elapsedMs >= nextTorpedo && range <= 20 && !(chooseType && tuning.hasEffect('shieldTunedTorpedo'))) {
            aimed.damage({ amount: 40, traits: ['torpedoWeapon'], sourceId: crew.ship.id });
            nextTorpedo = elapsedMs + torpedoEveryMs;
        }
    };
}

/** The four keys, turned together once the crew has been close enough to the master for this long, as an engineer's boosts and a count would take. */
function turnKeys(afterMs: number): Behaviour {
    let closeSince: number | null = null;

    return (crew, elapsedMs) => {
        const master = crew.encounter.master;
        if (crew.encounter.phase !== 'keys' || !alive(crew, master)) {
            closeSince = null;
            return;
        }

        const close = Math.hypot(at(crew, crew.ship).x - at(crew, master).x, at(crew, crew.ship).y - at(crew, master).y) <= 7;
        closeSince = close ? closeSince ?? elapsedMs : null;

        if (closeSince !== null && elapsedMs - closeSince >= afterMs) {
            // With the cards the keepers hand out: Key Power on each crew system in turn, then each station's key.
            const { ship } = crew;
            for (const role of crewRoleNames) {
                const keyPower = ship.engineerState.hand.find(card => card.type === 'keyPower');
                expect(keyPower && ship.engineerState.playCard(keyPower.id, 'keyPower', 'system', role)).toBeTruthy();
            }
            for (const role of crewRoleNames) {
                const system = ship.getCrewSystem(role);
                const key = system.hand.find(card => card.type.startsWith('shutdownKey'))!;
                expect(system.playCard(key.id, key.type, 'no-target', '')).toBeTruthy();
            }
            closeSince = null;
        }
    };
}

/** The engineer keeps its shields extended, from the moment the boat's out. */
const extendShields: Behaviour = (crew, elapsedMs) => {
    if (crew.encounter.phase === 'door' && elapsedMs % 10_000 === 0) {
        crew.ship.engineerState.systems.find(tile => tile.system === 'hull')!.addEffect('shieldsExtended');
    }
};

/** Plays the encounter out, AI and all, until it's decided, the crew is destroyed, or time's up, noting the crew's shield as each phase starts. */
function run(crew: Crew, maxMs: number, ...behaviours: Behaviour[]) {
    const { state } = crew;
    const tick = 100;
    let elapsed = 0;
    let boat: AiShip | null = null;

    for (; elapsed < maxMs && state.encounter?.outcome === null; elapsed += tick) {
        for (const behaviour of behaviours) {
            behaviour(crew, elapsed);
        }

        state.tick(tick);

        for (const delayed of [...rooms.getClock().delayed]) {
            if (delayed.active) {
                delayed.tick(tick);
            }
        }

        if (!state.encounter) {
            break;
        }

        const phase = crew.encounter.phase;
        if (phase !== crew.phases[crew.phases.length - 1].phase) {
            crew.phases.push({ phase, atSeconds: elapsed / 1000, shield: crew.ship.hullState.shield });
        }
        if (boat && !state.objects.has(boat.id) && crew.encounter.keepersBoat !== boat) {
            crew.boatsLost++;
        }
        boat = crew.encounter.keepersBoat;
    }

    const outcome = state.encounter ? state.encounter.outcome : 'crew destroyed' as const;
    crew.phases.push({ phase: 'end', atSeconds: elapsed / 1000, shield: state.encounter ? crew.ship.hullState.shield : 0 });
    return { seconds: elapsed / 1000, outcome };
}

function report(plan: string, seed: number, crew: Crew, result: ReturnType<typeof run>) {
    const phases = crew.phases.map(({ phase, atSeconds, shield }) => `${phase}@${atSeconds}s:${shield}`).join(' ');
    log(`${plan} seed ${seed}: ${result.outcome} at ${result.seconds}s, hull ${crew.ship.hullState.health}/${crew.ship.hullState.maxHealth}, boats lost ${crew.boatsLost}; ${phases}`);
    if (process.env.ENCOUNTER_HITS) {
        log(`    hits: ${crew.hits.join(' ')}`);
    }
}

/** How far from the middle of the square a crew goes round it, which keeps it out of every pylon's reach. */
const roundRadius = 38;

/**
 * The way to a point beside the master without passing another pylon: round the square, outside everyone's reach, until it's lined up with the master,
 * then straight in. A crew working the master from inside the square goes straight in.
 */
function approach(crew: Crew, master: AiShip, offset: number): Vector2D {
    const target = beside(crew, master, offset);
    if (offset < 0) {
        return target;
    }

    const from = at(crew, crew.ship);
    const bearing = (point: Vector2D) => Math.atan2(point.y - centre.y, point.x - centre.x);
    const difference = Math.atan2(Math.sin(bearing(target) - bearing(from)), Math.cos(bearing(target) - bearing(from)));
    if (Math.abs(difference) < 0.2) {
        return target;
    }

    const next = bearing(from) + Math.sign(difference) * Math.min(Math.abs(difference), 0.5);
    return { x: centre.x + Math.cos(next) * roundRadius, y: centre.y + Math.sin(next) * roundRadius };
}

/** Where a careful crew wants to be: off the master's far side while it works on it, close in for the keys, and beside the boat once it's out. */
function carefulCourse(standOff: number, keysAt: number): (crew: Crew, elapsedMs: number) => Vector2D | null {
    return (crew, elapsedMs) => {
        const master = crew.encounter.master;
        if (!alive(crew, master) || elapsedMs < 25_000) {
            return null;
        }

        switch (crew.encounter.phase) {
            case 'diagnose':
                return approach(crew, master, standOff);
            case 'keys':
                return approach(crew, master, keysAt);
            case 'door': {
                const boat = crew.encounter.keepersBoat;
                return alive(crew, boat) ? at(crew, boat) : beside(crew, master, Math.sign(standOff) * 3);
            }
        }
    };
}

const nearestDrone = (crew: Crew) => [...crew.state.objects.values()]
    .filter(object => object.name.startsWith('Drone'))
    .sort((a, b) => Math.hypot(at(crew, a).x - at(crew, crew.ship).x, at(crew, a).y - at(crew, crew.ship).y) - Math.hypot(at(crew, b).x - at(crew, crew.ship).x, at(crew, b).y - at(crew, crew.ship).y))[0] as AiShip | undefined;

/** What it's after: the master, until the door's open, then the nearest drone. */
const masterThenDrones = (crew: Crew) => (crew.encounter.phase === 'diagnose' ? crew.encounter.master : crew.encounter.phase === 'door' ? nearestDrone(crew) : null);

/** How each run came out, by plan, for the comparisons at the end. One campaign per test, so each run is its own case. */
const results = new Map<string, { seed: number; outcome: ReturnType<typeof run>['outcome']; shieldAt: Partial<Record<GatePhase | 'end', number>>; boatsLost: number }[]>();

function measure(plan: string, seed: number, maxMs: number, ...behaviours: Behaviour[]) {
    const crew = createRun(seed);
    const result = run(crew, maxMs, ...behaviours);
    report(plan, seed, crew, result);

    const shieldAt = Object.fromEntries(crew.phases.map(({ phase, shield }) => [phase, shield]));
    results.set(plan, [...results.get(plan) ?? [], { seed, outcome: result.outcome, shieldAt, boatsLost: crew.boatsLost }]);
    return { crew, result, shieldAt };
}

const count = (plan: string, outcome: ReturnType<typeof run>['outcome']) => (results.get(plan) ?? []).filter(run => run.outcome === outcome).length;

const masterOnly = (crew: Crew) => (crew.encounter.phase === 'diagnose' ? crew.encounter.master : null);

/**
 * What a played-out Quarantine Gate comes to. The crew is a script: helm flies at 1 unit a second, tactical lands a cannon shot every 8 seconds and
 * a torpedo every minute, every one a hit, from 30 seconds in, and the master is known after 25 seconds. So these are a ceiling.
 */
describe('QuarantineGateEncounter balance', () => {
    it.each(seeds)('a crew that does nothing is out of every pylon\'s reach where it starts (seed %i)', (seed) => {
        const { result, shieldAt } = measure('idle', seed, 300_000);

        expect(result.outcome).toBe(null);
        expect(shieldAt.end).toBe(120);
    });

    it.each(seeds)('a crew that flies into the middle of the square is destroyed within a minute and a half (seed %i)', (seed) => {
        const nearest = (c: Crew) => [...c.encounter.pylons].sort((a, b) => Math.hypot(at(c, a).x - at(c, c.ship).x, at(c, a).y - at(c, c.ship).y) - Math.hypot(at(c, b).x - at(c, c.ship).x, at(c, b).y - at(c, c.ship).y))[0];
        const { result } = measure('straight in', seed, 400_000, fly(() => centre), shoot(nearest));

        expect(result.outcome).toBe('crew destroyed');
        expect(result.seconds).toBeGreaterThan(60);
        expect(result.seconds).toBeLessThan(90);
    });

    it.each(seeds)('a careful crew, which goes round the square and works the master from outside it, gets the boat in (seed %i)', (seed) => {
        const { result, shieldAt } = measure('careful', seed, 500_000, fly(carefulCourse(9, 6)), shoot(masterThenDrones, { chooseType: true }), turnKeys(10_000));

        expect(result.outcome).toBe('success');
        expect(shieldAt.keys).toBeGreaterThan(0);
        expect(shieldAt.door).toBeGreaterThan(0);
    });

    it.each(seeds)('a crew that works the master from inside the square, in reach of three pylons, is destroyed (seed %i)', (seed) => {
        const { result } = measure('inside', seed, 500_000, fly(carefulCourse(-9, -6)), shoot(masterThenDrones, { chooseType: true }), turnKeys(10_000));

        expect(result.outcome).toBe('crew destroyed');
    });

    it.each(seeds)('a crew that doesn\'t wait to find the master, and tries the nearest pylon it hasn\'t tried yet (seed %i)', (seed) => {
        const tried = new Set<AiShip>();
        /** The pylon it's after: the nearest one whose shields it hasn't yet seen put back. */
        const guess = (c: Crew) => {
            for (const pylon of c.encounter.pylons) {
                if (pylon !== c.encounter.master && pylon.hullState.shield <= 0) {
                    tried.add(pylon);
                }
            }
            const from = at(c, c.ship);
            return c.encounter.pylons.filter(pylon => !tried.has(pylon))
                .sort((a, b) => Math.hypot(at(c, a).x - from.x, at(c, a).y - from.y) - Math.hypot(at(c, b).x - from.x, at(c, b).y - from.y))[0] ?? null;
        };
        const course = (c: Crew, elapsedMs: number) => {
            const target = c.encounter.phase === 'diagnose' ? guess(c) : null;
            return target ? approach(c, target, 9) : carefulCourse(9, 6)(c, Math.max(elapsedMs, 25_000));
        };
        const target = (c: Crew) => (c.encounter.phase === 'diagnose' ? guess(c) : c.encounter.phase === 'door' ? nearestDrone(c) : null);

        measure('guess', seed, 600_000, fly(course), shoot(target, { chooseType: true }), turnKeys(10_000));
    });

    it.each(seeds)('a crew that stays out of cannon range and uses only its torpedo on the master (seed %i)', (seed) => {
        measure('torpedo stand-off', seed, 900_000, fly(carefulCourse(15, 6)), shoot(masterThenDrones, { chooseType: true, cannonEveryMs: Infinity }), turnKeys(10_000));
    });

    it.each(seeds)('in the last phase, a crew that only covers the boat (seed %i)', (seed) => {
        measure('door: cover only', seed, 500_000, fly(carefulCourse(9, 6)), shoot(masterOnly, { chooseType: true }), turnKeys(10_000), extendShields);
    });

    it.each(seeds)('in the last phase, a crew that only shoots drones (seed %i)', (seed) => {
        measure('door: drones only', seed, 500_000, fly(carefulCourse(9, 6)), shoot(masterThenDrones, { chooseType: true }), turnKeys(10_000));
    });

    it.each(seeds)('in the last phase, a crew that does neither (seed %i)', (seed) => {
        measure('door: neither', seed, 500_000, fly(carefulCourse(9, 6)), shoot(masterOnly, { chooseType: true }), turnKeys(10_000));
    });

    describe('compared', () => {
        it('a crew that guesses rather than finding the master is destroyed on most seeds', () => {
            expect(count('guess', 'crew destroyed')).toBeGreaterThanOrEqual(3);
        });

        it('waiting outside cannon range isn\'t safe: the pylons\' torpedoes reach as far as the crew\'s', () => {
            expect(count('torpedo stand-off', 'crew destroyed')).toBeGreaterThanOrEqual(3);
        });

        it('in the last phase, shooting the drones always gets the boat in, and keeps what shield the crew had, where covering the boat spends all of it', () => {
            expect(count('door: drones only', 'success')).toBe(5);
            for (const { shieldAt } of results.get('door: drones only')!) {
                expect(shieldAt.end).toBe(shieldAt.door);
            }
            for (const { shieldAt } of results.get('door: cover only')!) {
                expect(shieldAt.end ?? 0).toBe(0);
            }
        });

        it('in the last phase, a crew that does neither loses boats', () => {
            expect(results.get('door: neither')!.filter(({ boatsLost }) => boatsLost > 0).length).toBeGreaterThanOrEqual(4);
        });
    });
});

import { MotionKeyframe } from 'src/state/MotionKeyframe';
import { seededRandom, setupGameRoom, startCampaign } from 'src/testUtils';
import { describe, expect, it } from 'vitest';
import { moduleScenarioId, tugScenarioId } from './DeadWeightEncounter';
import type { AiShip } from 'src/state/AiShip';
import type { GameState } from 'src/state/GameState';
import type { PlayerShip } from 'src/state/PlayerShip';

const rooms = setupGameRoom();

/** The player ship's shields at the start, as damage to its hull takes their capacity down with it. */
const fullShield = 120;

/** A campaign running Dead Weight, with its ships picked out. */
function createDeadWeight(seed: number, elite = false) {
    const state = rooms.createState(seededRandom(seed));
    const { campaign, ships } = startCampaign(state);
    campaign.devLoadEncounter('deadWeight', elite);

    return {
        state,
        ship: ships[0],
        tug: state.getObjectByScenarioId(tugScenarioId) as AiShip,
        module: state.getObjectByScenarioId(moduleScenarioId) as AiShip,
        bailiffs: [...state.objects.values()].filter(object => object.name.startsWith('Bailiff')) as AiShip[],
    };
}

type Crew = ReturnType<typeof createDeadWeight>;
/** Something the crew does, every tenth of a second. */
type Behaviour = (crew: Crew, elapsedMs: number) => void;

/** Plays the encounter out, AI and all, until it's decided, the game is over, or time's up. The room's timers aren't otherwise running, so those are moved on as well. */
function run(crew: Crew, maxMs: number, ...behaviours: Behaviour[]) {
    const { state } = crew;
    const tick = 100;
    let elapsed = 0;

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
    }

    // The game ends, and the encounter with it, if the crew is destroyed.
    return { seconds: elapsed / 1000, outcome: state.encounter ? state.encounter.outcome : 'crew destroyed' as const };
}

const range = (state: GameState, from: PlayerShip, to: AiShip) => {
    const a = from.getPosition(state.currentTime);
    const b = to.getPosition(state.currentTime);
    return Math.hypot(a.x - b.x, a.y - b.y);
};

const theTug = ({ tug }: Crew) => tug;
const aBailiff = ({ state, bailiffs }: Crew) => bailiffs.find(bailiff => state.objects.has(bailiff.id) && !bailiff.ai.commander.isWithdrawing);

/**
 * Helm keeps this far behind the tug (or whatever else it's after), flying straight for that point at no more than this speed. Every helm card goes at 1 unit a second at most,
 * and Slow and Steady, which the crew can always play, averages 0.75. Steering this well every half second is more than a crew could do.
 */
const follow = (gap: number, speed: number, leading: (crew: Crew) => AiShip | undefined = theTug): Behaviour => (crew, elapsedMs) => {
    const { state, ship } = crew;
    const leader = leading(crew);
    if (elapsedMs % 500 !== 0 || !leader || !state.objects.has(leader.id)) {
        return;
    }

    const now = state.currentTime;
    const at = ship.getPosition(now);
    const towards = leader.getPosition(now);
    const target = { x: towards.x - gap, y: towards.y };
    const distance = Math.hypot(target.x - at.x, target.y - at.y);
    const step = Math.min(distance, speed / 2);
    const scale = distance > 0 ? step / distance : 0;

    ship.setMotion(new MotionKeyframe(now, at.x, at.y, at.angle), new MotionKeyframe(now + 500, at.x + (target.x - at.x) * scale, at.y + (target.y - at.y) * scale, 0));
};

/**
 * Tactical lands a shot on the target every so often, from when its weapon is first loaded and charged, while it's in reach.
 * Shots always hit: this is about what each costs, not about aiming. The cannon is the fourth card of the crew's tactical deck,
 * which draws one about every 6 seconds, so the first cannon shot is about 30 seconds in. A full charge is four shots.
 */
function shoot(target: (crew: Crew) => AiShip | undefined, weapon: 'cannon' | 'torpedo', firstAtMs: number, intervalMs: number, aimAt?: 'helm'): Behaviour {
    let nextAt = firstAtMs;
    const { amount, traits, reach } = weapon === 'cannon'
        ? { amount: 20, traits: ['energyWeapon' as const], reach: 10 }
        : { amount: 40, traits: ['torpedoWeapon' as const], reach: 20 };

    return (crew, elapsedMs) => {
        const aimed = target(crew);
        if (elapsedMs < nextAt || !aimed || !crew.state.objects.has(aimed.id) || range(crew.state, crew.ship, aimed) > reach) {
            return;
        }

        aimed.damage({ amount, traits: [...traits], targetSystem: aimAt, sourceId: crew.ship.id });
        nextAt = elapsedMs + intervalMs;
    };
}

/** Just once, as there's one torpedo in the crew's deck, and it takes over a minute to come round again. */
const torpedoOnce = (target: (crew: Crew) => AiShip | undefined, atMs: number, aimAt?: 'helm') => shoot(target, 'torpedo', atMs, Infinity, aimAt);

/** What a played-out Dead Weight comes to, which says whether it's tuned right, rather than whether it works. */
describe('DeadWeightEncounter balance', () => {
    it.each([3, 7])('a crew that does nothing loses the module to the marker in under three minutes, and little else (seed %i)', (seed) => {
        const crew = createDeadWeight(seed);

        const { outcome, seconds } = run(crew, 300_000);

        expect(outcome).toBe('failure');
        expect(seconds).toBeGreaterThan(150);
        expect(seconds).toBeLessThan(180);
        expect(crew.ship.hullState.shield).toBeGreaterThan(fullShield / 2);
    });

    it.each([3, 7])('a crew that keeps within cannon range and puts its cannon on the engines gets the module back inside a minute (seed %i)', (seed) => {
        const crew = createDeadWeight(seed);

        const { outcome, seconds } = run(crew, 300_000, follow(7, 1), shoot(theTug, 'cannon', 35_000, 8000, 'helm'));

        expect(outcome).toBe('success');
        expect(seconds).toBeLessThan(60);
        // Three hits: two with its shields up, and the third through what's left of them.
        expect(crew.tug.hullState.health).toBe(10);
        expect(crew.module.hullState.health).toBe(crew.module.hullState.maxHealth);
    });

    it.each([3, 7])('a crew that can only manage Slow and Steady still gets close enough, as the tug starts slowly, but the bailiffs cost it more (seed %i)', (seed) => {
        const crew = createDeadWeight(seed);

        const { outcome, seconds } = run(crew, 300_000, follow(7, 0.75), shoot(theTug, 'cannon', 35_000, 8000, 'helm'));

        expect(outcome).toBe('success');
        expect(seconds).toBeLessThan(60);
        expect(crew.ship.hullState.shield).toBeLessThan(fullShield);
    });

    it.each([3, 7])('a crew that sits at strip range for the whole tow, shooting nothing, loses half its shields or more to the bailiffs, if not the ship (seed %i)', (seed) => {
        const crew = createDeadWeight(seed);

        const { outcome } = run(crew, 300_000, follow(4, 1));

        expect(outcome).not.toBe('success');
        expect(crew.ship.hullState.shield).toBeLessThanOrEqual(fullShield / 2);
    });

    // Chasing the bailiffs with one torpedo and then the cannon is a gamble. The second one keeps its distance, and its engineer repairs it.
    // But a ship whose helm is put out stops, so a cannon hit that lands on its helm leaves it where the next can reach, and it gives up.
    it.each([3, 9, 13])('a crew that chases the bailiffs often can\'t get its cannon on the second, and the tug gets away (seed %i)', (seed) => {
        const crew = createDeadWeight(seed);

        const { outcome } = run(crew, 300_000, follow(7, 1, chasing => aBailiff(chasing) ?? chasing.tug), torpedoOnce(aBailiff, 30_000), shoot(aBailiff, 'cannon', 40_000, 8000));

        expect(outcome).toBe('failure');
        expect(crew.bailiffs.filter(bailiff => crew.state.objects.has(bailiff.id))).toHaveLength(1);
    });

    it.each([7, 17])('a crew that chases the bailiffs as often stops the second in its tracks, and then it\'s as quick as going for the engines (seed %i)', (seed) => {
        const crew = createDeadWeight(seed);

        const { outcome, seconds } = run(crew, 300_000, follow(7, 1, chasing => aBailiff(chasing) ?? chasing.tug), torpedoOnce(aBailiff, 30_000), shoot(aBailiff, 'cannon', 40_000, 8000));

        expect(outcome).toBe('success');
        expect(seconds).toBeLessThan(70);
        expect(crew.tug.hullState.health).toBe(crew.tug.hullState.maxHealth);
    });

    it.each([3, 7])('a crew that goes after the bailiffs with its one torpedo, twice, gets the module back late (seed %i)', (seed) => {
        const crew = createDeadWeight(seed);

        const { outcome, seconds } = run(crew, 300_000, follow(7, 1, chasing => aBailiff(chasing) ?? chasing.tug), torpedoOnce(aBailiff, 30_000), torpedoOnce(aBailiff, 100_000));

        expect(outcome).toBe('success');
        expect(seconds).toBeGreaterThan(100);
        expect(seconds).toBeLessThan(120);
        expect(crew.tug.hullState.health).toBe(crew.tug.hullState.maxHealth);
    });

    it('a crew that torpedoes the tug once needs one cannon hit fewer, for half the module', () => {
        const crew = createDeadWeight(3);

        const { outcome, seconds } = run(crew, 300_000, follow(7, 1), torpedoOnce(theTug, 25_000, 'helm'), shoot(theTug, 'cannon', 35_000, 8000, 'helm'));

        expect(outcome).toBe('success');
        expect(seconds).toBeLessThan(50);
        expect(crew.module.hullState.health).toBe(crew.module.hullState.maxHealth / 2);
    });

    describe('elite', () => {
        it('a crew that does nothing has the module towed away with half its hull lost to its coolant', () => {
            const crew = createDeadWeight(3, true);

            const { outcome } = run(crew, 300_000);

            expect(outcome).toBe('failure');
            expect(crew.module.hullState.health).toBe(20);
        });

        it('one torpedo on the tug is fatal to the module, unless the engines follow quickly', () => {
            const slow = createDeadWeight(3, true);
            expect(run(slow, 300_000, torpedoOnce(theTug, 25_000, 'helm')).outcome).toBe('failure');
            expect(slow.state.objects.has(slow.module.id)).toBe(false);

            const quick = createDeadWeight(3, true);
            expect(run(quick, 300_000, follow(7, 1), torpedoOnce(theTug, 25_000, 'helm'), shoot(theTug, 'cannon', 35_000, 8000, 'helm')).outcome).toBe('success');
            expect(quick.module.hullState.health).toBeLessThan(20);
        });
    });
});

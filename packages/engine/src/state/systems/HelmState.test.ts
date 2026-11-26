import { CardState } from 'src/state/CardState';
import { PlayerShip } from 'src/state/PlayerShip';
import { shipSetup, setupGameRoom } from 'src/testUtils';
import { describe, expect, it } from 'vitest';
import { momentumDecayInterval, momentumWindow } from './HelmState';

const rooms = setupGameRoom();

function createMovingShip() {
    const state = rooms.createState();
    const { appearance: _a, faction: _f, ...setup } = shipSetup(undefined, 0, 0);
    setup.helm = { ...setup.helm, cards: ['slowAndSteady'], initialHandSize: 1 };
    const ship = new PlayerShip(state, setup);
    state.add(ship);
    ship.startEncounter();

    // Already facing +x, so this moves straight there without rotating first.
    const card = ship.helmState.hand[0];
    expect(ship.helmState.playCard(card.id, card.type, 'location', '40,0')).not.toBeNull();
    expect(ship.helmState.activeManeuver).not.toBeNull();

    return { state, ship };
}

describe('HelmState', () => {
    it('slows to a stop over 0.75s when a maneuver is cancelled, starting from where the ship is', () => {
        const { state, ship } = createMovingShip();
        for (let t = 0; t < 10_000; t += 100) {
            state.tick(100);
        }
        const cancelTime = state.currentTime;
        const before = ship.getPosition(cancelTime);
        const uninterrupted = ship.getPosition(cancelTime + 750);
        expect(before.x).toBeGreaterThan(1);

        ship.helmState.cancelActiveManeuver();
        state.tick(0);
        expect(ship.helmState.activeManeuver).toBeNull();

        // No jump at the moment of cancelling.
        const atCancel = ship.getPosition(cancelTime);
        expect(atCancel.x).toBeCloseTo(before.x);
        expect(atCancel.y).toBeCloseTo(before.y);

        // Still drifts forward while slowing, but less far than it would have gone.
        const stopped = ship.getPosition(cancelTime + 750);
        expect(stopped.x).toBeGreaterThan(before.x + 0.1);
        expect(stopped.x).toBeLessThan(uninterrupted.x);

        // Then stays put.
        expect(ship.getPosition(cancelTime + 5000).x).toBeCloseTo(stopped.x);
    });

    it('slows to a stop when the helm is put out, rather than finishing the maneuver it was flying', () => {
        const { state, ship } = createMovingShip();
        for (let t = 0; t < 10_000; t += 100) {
            state.tick(100);
        }
        const hitTime = state.currentTime;
        const before = ship.getPosition(hitTime);
        expect(before.x).toBeLessThan(20);

        // Every helm card damaged, the one being flown included.
        ship.helmState.adjustHealth(-ship.helmState.health);
        expect(ship.helmState.health).toBe(0);
        state.tick(0);
        expect(ship.helmState.activeManeuver).toBeNull();

        // It drifts a little as it slows, and gets nowhere near where it was going.
        const stopped = ship.getPosition(hitTime + 750);
        expect(stopped.x).toBeGreaterThan(before.x);
        expect(stopped.x).toBeLessThan(before.x + 2);
        expect(ship.getPosition(hitTime + 60_000).x).toBeCloseTo(stopped.x);
    });

    it('carries on with a maneuver while the helm is only damaged', () => {
        const { state, ship } = createMovingShip();
        ship.helmState.addDeckCard(ship.helmState.hand[0]?.cloneCard() ?? ship.helmState.activeManeuver!.card.cloneCard());
        for (let t = 0; t < 10_000; t += 100) {
            state.tick(100);
        }

        ship.helmState.adjustHealth(-1);
        expect(ship.helmState.health).toBeGreaterThan(0);
        state.tick(0);

        expect(ship.helmState.activeManeuver).not.toBeNull();
    });
});

/** A ship at the origin, facing +x, holding a Slow & Steady (which comes back to the hand each time it's played) and a Strafe. */
function createShip() {
    const state = rooms.createState();
    const { appearance: _a, faction: _f, ...setup } = shipSetup(undefined, 0, 0);
    setup.helm = { ...setup.helm, cards: ['slowAndSteady', 'strafe'], initialHandSize: 2 };
    const ship = new PlayerShip(state, setup);
    state.add(ship);
    ship.startEncounter();

    const helm = ship.helmState;
    const run = (duration: number) => {
        for (let t = 0; t < duration; t += 100) {
            state.tick(100);
        }
    };
    /** Plays the Slow & Steady to a point straight ahead, and says whether it was played. */
    const flyAhead = (distance: number) => {
        const card = helm.hand.find(candidate => candidate.type === 'slowAndSteady')!;
        const x = ship.getPosition(state.currentTime).x + distance;
        return helm.playCard(card.id, card.type, 'location', `${x},0`) !== null;
    };
    const runUntilManeuverEnds = () => {
        while (helm.activeManeuver) {
            state.tick(100);
        }
    };
    const momentum = () => helm.getEffects().find(effect => effect.type === 'momentum')?.level ?? 0;

    return { state, ship, helm, run, flyAhead, runUntilManeuverEnds, momentum };
}

describe('Momentum', () => {
    it('is gained by starting a maneuver within 2s of the last one finishing', () => {
        const { helm, run, flyAhead, runUntilManeuverEnds, momentum } = createShip();
        expect(momentumWindow).toBe(2000);

        expect(flyAhead(3)).toBe(true);
        expect(momentum()).toBe(0);
        runUntilManeuverEnds();

        run(1500);
        expect(flyAhead(3)).toBe(true);
        expect(momentum()).toBe(1);

        runUntilManeuverEnds();
        expect(flyAhead(3)).toBe(true);
        expect(momentum()).toBe(2);
        expect(helm.getEffects().find(effect => effect.type === 'momentum')!.progress).toBeNull();
    });

    it('is not gained by a maneuver that starts later than that', () => {
        const { run, flyAhead, runUntilManeuverEnds, momentum } = createShip();

        flyAhead(3);
        runUntilManeuverEnds();

        run(2500);
        expect(flyAhead(3)).toBe(true);
        expect(momentum()).toBe(0);
    });

    it('is not gained by following a maneuver that was cut short, or one too short to count', () => {
        const { state, ship, helm, run, flyAhead, runUntilManeuverEnds, momentum } = createShip();

        // Replacing a maneuver that's still being flown.
        flyAhead(10);
        run(2000);
        const strafe = helm.hand.find(card => card.type === 'strafe')!;
        const position = ship.getPosition(state.currentTime);
        expect(helm.playCard(strafe.id, 'strafe', 'location', `${position.x},2`)).not.toBeNull();
        expect(momentum()).toBe(0);

        // Following one that was replaced, and then one that was cancelled.
        expect(flyAhead(10)).toBe(true);
        expect(momentum()).toBe(0);
        run(2000);
        helm.cancelActiveManeuver();
        state.tick(100);
        expect(helm.activeManeuver).toBeNull();
        expect(flyAhead(3)).toBe(true);
        expect(momentum()).toBe(0);

        // Following a hop that took less than a second.
        runUntilManeuverEnds();
        run(3000);
        expect(flyAhead(0.3)).toBe(true);
        runUntilManeuverEnds();
        expect(flyAhead(3)).toBe(true);
        expect(momentum()).toBe(0);
    });

    it('is capped at its highest level', () => {
        const { helm, flyAhead, momentum } = createShip();

        flyAhead(10);
        helm.adjustEffectLevel('momentum', 20);
        expect(momentum()).toBe(5);
    });

    it('is lost a level at a time, every 1.5s that the ship sits still, but not while it keeps flying', () => {
        const { run, helm, flyAhead, runUntilManeuverEnds, momentum } = createShip();
        expect(momentumDecayInterval).toBe(1500);

        flyAhead(6);
        helm.adjustEffectLevel('momentum', 3);
        run(5000);
        expect(helm.activeManeuver).not.toBeNull();
        expect(momentum()).toBe(3);

        runUntilManeuverEnds();
        run(1400);
        expect(momentum()).toBe(3);

        run(200);
        expect(momentum()).toBe(2);
        run(1300);
        expect(momentum()).toBe(2);

        run(300);
        expect(momentum()).toBe(1);
        run(1500);
        expect(momentum()).toBe(0);
    });

    it('can still be built by chaining maneuvers within 2s, as a level is lost during that time', () => {
        const { run, helm, flyAhead, runUntilManeuverEnds, momentum } = createShip();

        flyAhead(3);
        helm.adjustEffectLevel('momentum', 2);
        runUntilManeuverEnds();
        run(1700);
        expect(momentum()).toBe(1);

        // Starting another adds one back.
        expect(flyAhead(3)).toBe(true);
        expect(momentum()).toBe(2);
    });

    it('makes the ship 3 points harder to hit for each level, on top of its maneuver', () => {
        const { helm, flyAhead, momentum } = createShip();

        flyAhead(10);
        expect(helm.evasion).toBe(helm.activeManeuver!.card.getParameter('evasion'));
        const base = helm.evasion;

        helm.adjustEffectLevel('momentum', 4);
        expect(momentum()).toBe(4);
        expect(helm.evasionModifier).toBe(12);
        expect(helm.evasion).toBe(base + 12);

        helm.adjustEffectLevel('momentum', -1);
        expect(helm.evasion).toBe(base + 9);

        helm.removeEffect('momentum', 'early');
        expect(helm.evasionModifier).toBe(0);
        expect(helm.evasion).toBe(base);
    });

    it('is shown to the helm as its level, and when the next one will be lost', () => {
        const { state, run, helm, flyAhead, runUntilManeuverEnds } = createShip();

        expect(helm.momentumLevel).toBe(0);
        expect(helm.momentumFade).toBeNull();

        flyAhead(6);
        helm.adjustEffectLevel('momentum', 2);
        expect(helm.momentumLevel).toBe(2);

        // While it's moving, nothing is about to be lost.
        run(1000);
        expect(helm.momentumFade).toBeNull();

        // Once it stops, the time left is counted from when it did.
        runUntilManeuverEnds();
        const stoppedAt = state.currentTime;
        run(300);
        expect(helm.momentumFade).not.toBeNull();
        expect(helm.momentumFade!.endTime - helm.momentumFade!.startTime).toBe(1500);
        expect(helm.momentumFade!.startTime).toBeLessThanOrEqual(stoppedAt);
        expect(helm.momentumFade!.endTime).toBeGreaterThan(state.currentTime);

        // A level goes, and the clock starts again for the next. Losing the last clears it.
        run(1400);
        expect(helm.momentumLevel).toBe(1);
        expect(helm.momentumFade!.endTime).toBeGreaterThan(state.currentTime);
        run(1600);
        expect(helm.momentumLevel).toBe(0);
        expect(helm.momentumFade).toBeNull();
    });

    it('is shown to the helm as a level lost to a hit', () => {
        const { ship, helm, flyAhead } = createShip();

        flyAhead(10);
        helm.adjustEffectLevel('momentum', 2);
        ship.damage({ amount: 1, traits: [], targetSystem: 'hull' });
        expect(helm.momentumLevel).toBe(1);
    });

    it('loses one level each time the ship is hit', () => {
        const { ship, helm, flyAhead, momentum } = createShip();

        flyAhead(10);
        helm.adjustEffectLevel('momentum', 2);

        ship.damage({ amount: 1, traits: [], targetSystem: 'hull' });
        expect(momentum()).toBe(1);

        ship.damage({ amount: 1, traits: [], targetSystem: 'hull' });
        expect(momentum()).toBe(0);

        // With none left, a hit changes nothing.
        ship.damage({ amount: 1, traits: [], targetSystem: 'hull' });
        expect(momentum()).toBe(0);
    });

    it('draws a card for each level lost by sitting still, but not for one lost to a hit', () => {
        const { ship, helm, run, flyAhead, runUntilManeuverEnds, momentum } = createShip();

        flyAhead(3);
        helm.adjustEffectLevel('momentum', 2);
        runUntilManeuverEnds();

        // Make sure there are cards to draw. The hand is checked just before and after the level goes, as the reactor has the helm draw cards now and then too.
        helm.deck.push(new CardState(ship.getCardId(), 'strafe'), new CardState(ship.getCardId(), 'strafe'));
        run(1400);
        expect(momentum()).toBe(2);
        const handBefore = helm.hand.length;

        run(200);
        expect(momentum()).toBe(1);
        expect(helm.hand).toHaveLength(handBefore + 1);

        // A hit takes the last level away, without drawing a card.
        ship.damage({ amount: 1, traits: [], targetSystem: 'hull' });
        expect(momentum()).toBe(0);
        expect(helm.hand).toHaveLength(handBefore + 1);
    });

    it('makes each maneuver 10% faster per level', () => {
        const { helm, flyAhead, runUntilManeuverEnds } = createShip();

        // Slow & Steady flies at 0.75 units a second.
        flyAhead(6);
        expect(helm.activeManeuver!.endTime - helm.activeManeuver!.startTime).toBeCloseTo(8000);
        helm.adjustEffectLevel('momentum', 2);
        expect(helm.maneuverSpeedMultiplier).toBeCloseTo(1.2);
        runUntilManeuverEnds();

        // Following straight on adds a third level, but the maneuver that earns it is flown with the two there were.
        flyAhead(6);
        expect(helm.activeManeuver!.endTime - helm.activeManeuver!.startTime).toBeCloseTo(8000 / 1.2);
        expect(helm.maneuverSpeedMultiplier).toBeCloseTo(1.3);

        helm.removeEffect('momentum', 'expired');
        expect(helm.maneuverSpeedMultiplier).toBe(1);
    });

    it('is cleared away after an encounter', () => {
        const { helm, flyAhead, momentum } = createShip();

        flyAhead(6);
        helm.adjustEffectLevel('momentum', 2);
        helm.cleanupAfterEncounter();

        expect(momentum()).toBe(0);
        expect(helm.maneuverSpeedMultiplier).toBe(1);
    });
});

describe('HelmState maneuvers', () => {
    it('puts the card of a maneuver that another one replaces back in the deck', () => {
        const { helm, flyAhead } = createShip();
        const strafe = helm.hand.find(card => card.type === 'strafe')!;

        expect(helm.playCard(strafe.id, 'strafe', 'location', '0,2')).not.toBeNull();
        expect(helm.activeManeuver!.card).toBe(strafe);
        expect(helm.deck.includes(strafe)).toBe(false);

        expect(flyAhead(5)).toBe(true);
        expect(helm.activeManeuver!.card.type).toBe('slowAndSteady');
        expect(helm.deck.filter(card => card === strafe)).toHaveLength(1);
    });

    it('tells whoever asked when the maneuver being flown ends, once, however it ends', () => {
        const { state, helm, flyAhead, runUntilManeuverEnds } = createShip();
        let ended = 0;

        flyAhead(3);
        helm.whenActiveManeuverEnds(() => ended++);
        runUntilManeuverEnds();
        expect(ended).toBe(1);

        flyAhead(10);
        helm.whenActiveManeuverEnds(() => ended++);
        helm.cancelActiveManeuver();
        state.tick(100);
        expect(ended).toBe(2);

        state.tick(100);
        expect(ended).toBe(2);
    });

    it('adds whatever else is making the ship hard to hit to the evasion of the maneuver it is flying', () => {
        const { ship, helm } = createShip();
        const zigZag = new CardState(ship.getCardId(), 'zigZag');
        helm.addCardToHand(zigZag);
        helm.adjustPowerLevel(5);

        expect(helm.evasion).toBe(0);
        helm.evasionModifier = 10;
        expect(helm.evasion).toBe(10);

        expect(helm.playCard(zigZag.id, 'zigZag', 'location', '10,0')).not.toBeNull();
        expect(helm.evasion).toBe(35);
    });
});

import { cardDefinitions, type CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { getShopCardTypes } from 'common-data/features/cards/utils/getShopCardTypes';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { getCardEvaluator } from 'engine/ai/evaluators';
import { getCardDefinition } from 'engine/cards/getEngineCardDefinition';
import { AiShip } from 'engine/state/AiShip';
import { CardState } from 'engine/state/CardState';
import { MotionKeyframe } from 'engine/state/MotionKeyframe';
import { PlayerShip } from 'engine/state/PlayerShip';
import { setupGameRoom, shipSetup } from 'engine/testUtils';
import { describe, expect, it } from 'vitest';
import type { GameObject } from 'engine/state/GameObject';

const rooms = setupGameRoom();

/** A ship at the origin, facing +x, with full helm power, an empty helm hand and a ten-card hull, and another ship 10 units ahead of it. */
function createShip() {
    const state = rooms.createState();
    const { appearance: _a, faction: _f, ...setup } = shipSetup(undefined, 0, 0);
    setup.hull = { ...setup.hull, cards: new Array<'hullBare'>(10).fill('hullBare') };
    const ship = new PlayerShip(state, setup);
    state.add(ship);
    ship.startEncounter();

    const { appearance: _a2, faction: _f2, ...otherSetup } = shipSetup(undefined, 10, 0);
    const other = new PlayerShip(state, otherSetup);
    state.add(other);
    other.startEncounter();

    const helm = ship.helmState;
    helm.adjustPowerLevel(5);

    /** Puts a card of the given type into the helm's hand and plays it, at a location if one is given. Says whether it was played. */
    const play = (type: CardType, location?: string, playedType: CardType = type) => {
        const card = new CardState(ship.getCardId(), type);
        helm.addCardToHand(card);
        const played = helm.playCard(card.id, playedType, location === undefined ? 'no-target' : 'location', location ?? '') !== null;
        return { card, played };
    };
    const run = (duration: number) => {
        for (let t = 0; t < duration; t += 100) {
            state.tick(100);
        }
    };
    const runUntilManeuverEnds = () => {
        while (helm.activeManeuver) {
            state.tick(100);
        }
    };
    const maneuverDuration = () => helm.activeManeuver!.endTime - helm.activeManeuver!.startTime;
    const effectLevel = (system: 'helm' | 'hull', type: string) => ship.getSystem(system).getEffects().find(effect => effect.type === type)?.level ?? 0;
    const momentum = () => effectLevel('helm', 'momentum');
    /** The chance that a shot from one ship's weapon would hit the other, for a weapon with no accuracy of its own. */
    const accuracy = (from: PlayerShip, target: PlayerShip) => (from.tacticalState as unknown as { determineAccuracy: (target: GameObject, subTarget: undefined, weaponAccuracy: number) => number })
        .determineAccuracy(target, undefined, 0);

    return { state, ship, other, helm, play, run, runUntilManeuverEnds, maneuverDuration, effectLevel, momentum, accuracy };
}

describe('Burn', () => {
    it('flies straight to the target at speed, and adds 2 Momentum', () => {
        const { state, ship, helm, play, momentum, maneuverDuration, runUntilManeuverEnds } = createShip();
        expect(cardDefinitions.burn).toMatchObject({ targetType: 'location', system: 'helm', baseSpeed: 1.5, parameters: { cost: 2, evasion: 10, momentum: 2 } });

        const { card, played } = play('burn', '6,0');
        expect(played).toBe(true);
        expect(helm.activeManeuver!.card).toBe(card);
        expect(maneuverDuration()).toBeCloseTo(4000);
        expect(momentum()).toBe(2);
        expect(helm.evasion).toBe(10);

        runUntilManeuverEnds();
        const position = ship.getPosition(state.currentTime);
        expect(position.x).toBeCloseTo(6);
        expect(position.y).toBeCloseTo(0);
        expect(helm.deck.includes(card)).toBe(true);
    });

    it('gains nothing if it cannot be played', () => {
        const { play, momentum } = createShip();

        // Too close.
        expect(play('burn', '1,0').played).toBe(false);
        expect(momentum()).toBe(0);
    });

    it('makes the next maneuver faster', () => {
        const { play, maneuverDuration, runUntilManeuverEnds, momentum } = createShip();

        play('burn', '6,0');
        runUntilManeuverEnds();

        // Following straight on adds a third level, but this maneuver is flown with the two that the first one gave.
        expect(play('burn', '12,0').played).toBe(true);
        expect(maneuverDuration()).toBeCloseTo(4000 / 1.2);
        expect(momentum()).toBe(5);
    });
});

describe('Full Impulse', () => {
    it('is an ordinary straight move with no Momentum', () => {
        const { helm, play, maneuverDuration, momentum } = createShip();
        expect(cardDefinitions.fullImpulse).toMatchObject({ targetType: 'location', system: 'helm', baseSpeed: 1, parameters: { cost: 2, evasion: 10, speedPerMomentum: 15, evasionPerMomentum: 8 } });

        expect(play('fullImpulse', '6,0').played).toBe(true);
        expect(maneuverDuration()).toBeCloseTo(6000);
        expect(helm.evasion).toBe(10);
        expect(momentum()).toBe(0);
    });

    it('is faster and harder to hit for each level of Momentum, and spends half of it', () => {
        const { helm, other, ship, play, run, maneuverDuration, momentum, accuracy, runUntilManeuverEnds } = createShip();

        play('burn', '6,0');
        helm.adjustEffectLevel('momentum', 2);
        expect(momentum()).toBe(4);
        run(1000);

        // Momentum itself makes it 40% faster, and the card another 60%.
        const { card, played } = play('fullImpulse', '12,0');
        expect(played).toBe(true);
        const distance = 12 - ship.getPosition(helm.activeManeuver!.startTime).x;
        expect(maneuverDuration()).toBeCloseTo(distance / (1 * 1.4 * 1.6) * 1000);
        expect(helm.evasion).toBe(10 + 4 * 8);
        expect(accuracy(other, ship)).toBe(100 - 42);
        expect(momentum()).toBe(2);

        // The card goes back to what it was once it has been flown.
        runUntilManeuverEnds();
        expect(card.getParameter('evasion')).toBe(10);
        expect(helm.evasion).toBe(0);
    });

    it('spends the larger half of an odd amount of Momentum', () => {
        const { helm, play, momentum } = createShip();

        play('burn', '6,0');
        helm.adjustEffectLevel('momentum', 1);
        expect(momentum()).toBe(3);

        play('fullImpulse', '12,0');
        expect(momentum()).toBe(1);
    });
});

describe('Evasive Pattern', () => {
    it('jinks in place for 5 seconds, hard to hit but with less accurate weapons', () => {
        const { state, ship, other, helm, play, run, effectLevel, accuracy } = createShip();
        expect(cardDefinitions.evasivePattern).toMatchObject({ targetType: 'no-target', system: 'helm', parameters: { cost: 2, evasion: 40, accuracyLoss: 25, duration: 5 } });

        const { card, played } = play('evasivePattern');
        expect(played).toBe(true);
        expect(helm.activeManeuver!.card).toBe(card);
        expect(helm.hand.includes(card)).toBe(false);
        expect(helm.deck.includes(card)).toBe(false);
        expect(helm.evasion).toBe(40);
        expect(effectLevel('helm', 'jinking')).toBe(25);
        expect(accuracy(other, ship)).toBe(60);
        expect(accuracy(ship, other)).toBe(75);

        // It moves from side to side, without going forward or turning.
        let furthest = 0;
        for (let t = 0; t < 4900; t += 100) {
            state.tick(100);
            const position = ship.getPosition(state.currentTime);
            expect(position.x).toBeCloseTo(0);
            expect(position.angle).toBeCloseTo(0);
            furthest = Math.max(furthest, Math.abs(position.y));
        }
        expect(furthest).toBeGreaterThan(0.3);
        expect(helm.activeManeuver).not.toBeNull();

        // And ends where it began, with the card back in the deck.
        run(200);
        expect(helm.activeManeuver).toBeNull();
        expect(ship.getPosition(state.currentTime).y).toBeCloseTo(0);
        expect(helm.deck.filter(candidate => candidate === card)).toHaveLength(1);
        expect(effectLevel('helm', 'jinking')).toBe(0);
        expect(accuracy(other, ship)).toBe(100);
        expect(accuracy(ship, other)).toBe(100);
    });

    it('keeps Momentum, as the ship never stops moving', () => {
        const { helm, play, run, momentum, runUntilManeuverEnds } = createShip();

        play('burn', '6,0');
        runUntilManeuverEnds();
        expect(play('evasivePattern').played).toBe(true);
        expect(momentum()).toBe(3);

        run(4500);
        expect(helm.activeManeuver).not.toBeNull();
        expect(momentum()).toBe(3);
    });

    it('stops throwing the weapons off as soon as it is called off', () => {
        const { state, ship, other, helm, play, run, effectLevel, accuracy } = createShip();

        play('evasivePattern');
        run(1000);
        helm.cancelActiveManeuver();
        state.tick(100);

        expect(helm.activeManeuver).toBeNull();
        expect(effectLevel('helm', 'jinking')).toBe(0);
        expect(accuracy(ship, other)).toBe(100);
    });
});

describe('Broadside', () => {
    it('moves slowly to the target, turning side-on to the way it is going as it does', () => {
        const { state, ship, helm, play, maneuverDuration, runUntilManeuverEnds } = createShip();
        expect(cardDefinitions.broadside).toMatchObject({ targetType: 'choice', system: 'helm', cards: ['broadsideLeft', 'broadsideRight'], parameters: { cost: 1 } });
        expect(cardDefinitions.broadsideLeft).toMatchObject({ targetType: 'location', baseSpeed: 0.5, parameters: { cost: 1, evasion: 0 } });

        const { card, played } = play('broadside', '4,0', 'broadsideRight');
        expect(played).toBe(true);
        expect(helm.activeManeuver!.card).toBe(card);
        expect(maneuverDuration()).toBeCloseTo(8000);
        expect(helm.evasion).toBe(0);

        // Half way there, it's half way round.
        state.tick(4000);
        const midway = ship.getPosition(state.currentTime);
        expect(midway.x).toBeGreaterThan(1);
        expect(midway.x).toBeLessThan(3);
        expect(midway.angle).toBeGreaterThan(0.2);
        expect(midway.angle).toBeLessThan(Math.PI / 2 - 0.2);

        runUntilManeuverEnds();
        const end = ship.getPosition(state.currentTime);
        expect(end.x).toBeCloseTo(4);
        expect(end.y).toBeCloseTo(0);
        expect(end.angle).toBeCloseTo(Math.PI / 2);
    });

    it('turns the other way when flown to the left', () => {
        const { state, ship, play, runUntilManeuverEnds } = createShip();

        expect(play('broadside', '4,0', 'broadsideLeft').played).toBe(true);
        runUntilManeuverEnds();

        const end = ship.getPosition(state.currentTime);
        expect(end.x).toBeCloseTo(4);
        expect(end.angle).toBeCloseTo(-Math.PI / 2);
    });
});

describe('Slingshot', () => {
    it('curves to the target, turning through 180 degrees, and adds 1 Momentum', () => {
        const { state, ship, helm, play, momentum, runUntilManeuverEnds } = createShip();
        expect(cardDefinitions.slingshot).toMatchObject({ targetType: 'choice', system: 'helm', cards: ['slingshotLeft', 'slingshotRight'], parameters: { cost: 3, evasion: 30, momentum: 1 } });
        expect(cardDefinitions.slingshotLeft).toMatchObject({ targetType: 'location', baseSpeed: 1.25, minDistance: 6, parameters: { cost: 3, evasion: 30, momentum: 1 } });

        expect(play('slingshot', '6,0', 'slingshotLeft').played).toBe(true);
        expect(momentum()).toBe(1);
        expect(helm.evasion).toBe(30);

        // It swings out to one side by half the distance, and comes back to the line at the target.
        let furthest = 0;
        while (helm.activeManeuver) {
            state.tick(100);
            furthest = Math.max(furthest, ship.getPosition(state.currentTime).y);
        }
        expect(furthest).toBeGreaterThan(2.5);
        expect(furthest).toBeLessThan(3.5);

        const end = ship.getPosition(state.currentTime);
        expect(end.x).toBeCloseTo(6);
        expect(end.y).toBeCloseTo(0);
        expect(Math.abs(end.angle)).toBeCloseTo(Math.PI / 2);

        runUntilManeuverEnds();
    });

    it('swings out to the other side when flown to the right', () => {
        const { state, ship, helm, play } = createShip();

        expect(play('slingshot', '6,0', 'slingshotRight').played).toBe(true);

        let furthest = 0;
        while (helm.activeManeuver) {
            state.tick(100);
            furthest = Math.min(furthest, ship.getPosition(state.currentTime).y);
        }
        expect(furthest).toBeLessThan(-2.5);
    });
});

describe('Sweep', () => {
    it('is as hard to hit as its options say, whichever way it is flown', () => {
        expect(cardDefinitions.sweep).toMatchObject({ targetType: 'choice', parameters: { cost: 2, evasion: 15 } });

        for (const option of ['sweepLeft', 'sweepRight'] as const) {
            const { helm, play } = createShip();
            expect(cardDefinitions[option]).toMatchObject({ parameters: { evasion: 15 } });

            const { card, played } = play('sweep', '6,0', option);
            expect(played).toBe(true);
            expect(helm.activeManeuver!.card).toBe(card);
            expect(helm.evasion).toBe(15);
        }
    });
});

describe('Lock On', () => {
    /**
     * A ship as `createShip` makes, where the player's ships are hostile to raiders, with a way to add raider ships that stay wherever they're put.
     * Only the player's ship is ticked, so that no raider's AI moves it.
     */
    function createLockingShip() {
        rooms.createState().initFactions([
            { id: 'player' },
            { id: 'raiders', relations: { player: RelationshipType.Hostile } },
        ], 'player');
        const world = createShip();
        const { state, ship, helm } = world;

        const addRaider = (x: number, y: number) => {
            const raider = new AiShip(state, { ...shipSetup('raiders', x, y), goal: { type: 'search-and-destroy' }, skill: 1 });
            state.add(raider);
            return raider;
        };
        const moveTo = (raider: AiShip, x: number, y: number) => raider.setMotion(new MotionKeyframe(state.currentTime, x, y, 0));
        const runShip = (duration: number) => {
            for (let t = 0; t < duration; t += 100) {
                state.currentTime += 100;
                ship.tick(100, state.currentTime);
            }
        };
        const angle = () => ship.getPosition(state.currentTime).angle;
        const playOn = (target: PlayerShip | AiShip) => {
            ship.updateKnownObjects(state.currentTime);
            const card = new CardState(ship.getCardId(), 'lockOn');
            helm.addCardToHand(card);
            return { card, played: helm.playCard(card.id, 'lockOn', 'ship', target.id) !== null };
        };

        return { ...world, addRaider, moveTo, runShip, angle, playOn };
    }

    it('is a common, hostile-ship-targeted card that says it stops the ship', () => {
        expect(cardDefinitions.lockOn).toMatchObject({ targetType: 'ship', targetRelationship: 'hostile', system: 'helm', parameters: { cost: 2, evasion: 0, accuracy: 20, duration: 8 } });
        expect(cardDefinitions.lockOn).not.toHaveProperty('rarity');
        expect(cardDefinitions).not.toHaveProperty('holdSteady');
        expect(getCardEvaluator('lockOn')).toBeUndefined();
        expect(getShopCardTypes('helm')).toContain('lockOn');
    });

    it('turns on the spot to face the chosen ship, 45 degrees a second, for 8 seconds', () => {
        const { state, ship, helm, playOn, addRaider, runShip, angle } = createLockingShip();

        // It faces the chosen raider, not the closer one.
        const chosen = addRaider(0, -10);
        addRaider(-3, 0);

        const { card, played } = playOn(chosen);
        expect(played).toBe(true);
        expect(helm.activeManeuver!.card).toBe(card);
        expect(helm.activeManeuver!.endTime - helm.activeManeuver!.startTime).toBe(8000);
        expect(helm.evasion).toBe(0);

        runShip(1000);
        expect(angle()).toBeGreaterThan(Math.PI / 4 - 0.15);
        expect(angle()).toBeLessThan(Math.PI / 4 + 0.05);

        runShip(1500);
        expect(angle()).toBeCloseTo(Math.PI / 2, 2);
        expect(ship.getPosition(state.currentTime)).toMatchObject({ x: 0, y: 0 });

        runShip(5400);
        expect(helm.activeManeuver).not.toBeNull();
        expect(angle()).toBeCloseTo(Math.PI / 2, 2);

        runShip(200);
        expect(helm.activeManeuver).toBeNull();
        expect(helm.deck.filter(candidate => candidate === card)).toHaveLength(1);

        // It holds its heading once it's done.
        runShip(1000);
        expect(angle()).toBeCloseTo(Math.PI / 2, 2);
        expect(ship.getPosition(state.currentTime)).toMatchObject({ x: 0, y: 0 });
    });

    it('brings the ship to a stop where it is', () => {
        const { state, ship, play, playOn, addRaider, runShip } = createLockingShip();
        const raider = addRaider(0, 10);

        play('burn', '6,0');
        runShip(1000);
        const flyingAt = ship.getPosition(state.currentTime);
        expect(flyingAt.x).toBeGreaterThan(0.5);
        expect(flyingAt.x).toBeLessThan(5);

        expect(playOn(raider).played).toBe(true);
        runShip(300);
        const stoppedAt = ship.getPosition(state.currentTime);
        expect(stoppedAt.x).toBeLessThan(flyingAt.x + 0.5);

        runShip(5000);
        expect(ship.getPosition(state.currentTime)).toMatchObject({ x: stoppedAt.x, y: stoppedAt.y });
    });

    it('follows the chosen ship as it moves, ignoring others that come closer', () => {
        const { playOn, addRaider, moveTo, runShip, angle } = createLockingShip();
        const chosen = addRaider(10, 0);
        const other = addRaider(-20, 0);

        playOn(chosen);
        runShip(1000);
        expect(angle()).toBeCloseTo(0, 2);

        // The chosen raider slips round to the side.
        moveTo(chosen, 0, -10);
        runShip(2500);
        expect(angle()).toBeCloseTo(Math.PI / 2, 2);

        // The other raider coming in close behind makes no difference.
        moveTo(other, -3, 0);
        runShip(2000);
        expect(angle()).toBeCloseTo(Math.PI / 2, 2);
    });

    it('makes the ship\'s weapons 20% more accurate until it ends', () => {
        const { ship, other, helm, playOn, addRaider, runShip, effectLevel, accuracy } = createLockingShip();
        const raider = addRaider(0, -10);

        // The other ship is flying something that makes it harder to hit.
        other.helmState.evasionModifier = 30;
        expect(accuracy(ship, other)).toBe(70);

        playOn(raider);
        expect(effectLevel('helm', 'holdingSteady')).toBe(20);
        expect(accuracy(ship, other)).toBe(90);

        runShip(7800);
        expect(helm.activeManeuver).not.toBeNull();
        expect(accuracy(ship, other)).toBe(90);

        runShip(300);
        expect(helm.activeManeuver).toBeNull();
        expect(effectLevel('helm', 'holdingSteady')).toBe(0);
        expect(accuracy(ship, other)).toBe(70);
    });

    it('stops turning, and steadying the weapons, as soon as it is called off', () => {
        const { helm, playOn, addRaider, runShip, angle, effectLevel } = createLockingShip();
        const raider = addRaider(0, -10);

        playOn(raider);
        runShip(500);
        helm.cancelActiveManeuver();
        runShip(100);
        expect(helm.activeManeuver).toBeNull();
        expect(effectLevel('helm', 'holdingSteady')).toBe(0);

        runShip(1000);
        const stoppedAt = angle();
        expect(stoppedAt).toBeGreaterThan(0.1);
        expect(stoppedAt).toBeLessThan(Math.PI / 4);

        runShip(2000);
        expect(angle()).toBe(stoppedAt);
    });

    it('stops steadying the weapons as soon as the ship flies something else', () => {
        const { play, playOn, addRaider, runShip, effectLevel } = createLockingShip();

        playOn(addRaider(0, -10));
        runShip(1000);
        expect(play('burn', '6,0').played).toBe(true);
        expect(effectLevel('helm', 'holdingSteady')).toBe(0);
    });

    it('is called off when the target is lost', () => {
        const { state, helm, playOn, addRaider, runShip, effectLevel } = createLockingShip();
        const raider = addRaider(0, -10);

        playOn(raider);
        runShip(1000);
        state.remove(raider);
        runShip(200);
        expect(helm.activeManeuver).toBeNull();
        expect(effectLevel('helm', 'holdingSteady')).toBe(0);
    });

    it('cannot be played on a friendly ship, or on a location', () => {
        const { ship, other, helm, play, playOn } = createLockingShip();

        expect(playOn(other).played).toBe(false);
        expect(playOn(ship).played).toBe(false);
        expect(play('lockOn', '0,5').played).toBe(false);
        expect(helm.activeManeuver).toBeNull();
    });

    it('loses Momentum, as the ship is still for longer than 2 seconds', () => {
        const { play, playOn, addRaider, run, momentum, runUntilManeuverEnds } = createLockingShip();
        // Straight ahead of the ship, so that it has no turning to do.
        const raider = addRaider(20, 0);

        play('burn', '6,0');
        runUntilManeuverEnds();
        playOn(raider);
        expect(momentum()).toBeGreaterThan(0);

        run(2200);
        expect(momentum()).toBe(0);
    });
});

/**
 * A ship as `createShip` makes, where the player's ships are hostile to raiders, with ways to add raider ships and to fly ships at a steady speed.
 * Only the player's ship is ticked, so other ships only move as they're told to.
 */
function createRelativeWorld() {
    rooms.createState().initFactions([
        { id: 'player' },
        { id: 'raiders', relations: { player: RelationshipType.Hostile } },
    ], 'player');
    const world = createShip();
    const { state, ship, helm } = world;

    const addRaider = (x: number, y: number, angle = 0) => {
        const raider = new AiShip(state, { ...shipSetup('raiders', x, y), goal: { type: 'search-and-destroy' }, skill: 1 });
        raider.setMotion(new MotionKeyframe(state.currentTime, x, y, angle));
        state.add(raider);
        return raider;
    };
    /** Has a ship fly from where it is in the given direction, at the given speed in units per second, for the next 20 seconds. */
    const fly = (flown: PlayerShip | AiShip, dx: number, dy: number, speed: number) => {
        const from = flown.getPosition(state.currentTime);
        const length = Math.hypot(dx, dy);
        flown.setMotion(...Array.from({ length: 201 }, (_, step) => new MotionKeyframe(
            state.currentTime + step * 100,
            from.x + dx / length * speed * step / 10,
            from.y + dy / length * speed * step / 10,
            from.angle
        )));
    };
    const place = (placed: PlayerShip | AiShip, x: number, y: number, angle = 0) => placed.setMotion(new MotionKeyframe(state.currentTime, x, y, angle));
    const runShip = (duration: number) => {
        for (let t = 0; t < duration; t += 100) {
            state.currentTime += 100;
            ship.tick(100, state.currentTime);
        }
    };
    const playOn = (type: CardType, target: PlayerShip | AiShip) => {
        ship.updateKnownObjects(state.currentTime);
        const card = new CardState(ship.getCardId(), type);
        helm.addCardToHand(card);
        return { card, played: helm.playCard(card.id, type, 'ship', target.id) !== null };
    };
    const position = () => ship.getPosition(state.currentTime);
    /** Where the ship is, relative to the given ship. */
    const offsetFrom = (target: PlayerShip | AiShip) => {
        const own = position();
        const at = target.getPosition(state.currentTime);
        return { x: own.x - at.x, y: own.y - at.y };
    };
    const rangeTo = (target: PlayerShip | AiShip) => Math.hypot(offsetFrom(target).x, offsetFrom(target).y);

    return { ...world, addRaider, fly, place, runShip, playOn, position, offsetFrom, rangeTo };
}

describe('Orbit', () => {
    it('circles the target at the range it started at, side-on to it, for 10 seconds', () => {
        const { helm, addRaider, runShip, playOn, position, offsetFrom, rangeTo } = createRelativeWorld();
        expect(cardDefinitions.orbit).toMatchObject({ targetType: 'ship', system: 'helm', parameters: { cost: 2, evasion: 15, duration: 10, momentum: 1, momentumInterval: 3 } });
        expect(getCardDefinition('orbit').synergy).toEqual({ provides: ['momentum'] });
        expect(cardDefinitions.orbit).not.toHaveProperty('rarity');
        expect(cardDefinitions.orbit).not.toHaveProperty('targetRelationship');

        const raider = addRaider(10, 0);
        const { card, played } = playOn('orbit', raider);
        expect(played).toBe(true);
        expect(helm.activeManeuver!.card).toBe(card);
        expect(helm.activeManeuver!.endTime - helm.activeManeuver!.startTime).toBe(10000);
        expect(helm.evasion).toBe(15);

        // It stays 10 units from the raider all the way round, travelling about 1 unit a second.
        for (let elapsed = 0; elapsed < 9800; elapsed += 100) {
            runShip(100);
            expect(rangeTo(raider)).toBeGreaterThan(9.4);
            expect(rangeTo(raider)).toBeLessThan(10.4);
        }
        expect(helm.activeManeuver).not.toBeNull();

        // It started at a bearing of 180 degrees from the raider, and has gone most of a radian round.
        const bearing = Math.atan2(offsetFrom(raider).y, offsetFrom(raider).x);
        const gone = Math.PI - Math.abs(bearing);
        expect(gone).toBeGreaterThan(0.6);
        expect(gone).toBeLessThan(1.1);

        // Its side is to the raider: its heading is square to the line between them. A ship's angle goes the opposite way round to Math.atan2's.
        const toRaider = Math.atan2(-offsetFrom(raider).y, -offsetFrom(raider).x);
        expect(Math.abs(Math.cos(position().angle + toRaider))).toBeLessThan(0.15);

        runShip(300);
        expect(helm.activeManeuver).toBeNull();
        expect(helm.deck.filter(candidate => candidate === card)).toHaveLength(1);
        const stoppedAt = position();
        runShip(1000);
        expect(position().x).toBeCloseTo(stoppedAt.x, 2);
        expect(position().y).toBeCloseTo(stoppedAt.y, 2);
    });

    it('can be played on friendly ships too', () => {
        const { helm, other, place, playOn } = createRelativeWorld();
        place(other, 0, 10);

        expect(playOn('orbit', other).played).toBe(true);
        expect(helm.activeManeuver).not.toBeNull();
    });

    it('goes round whichever way needs the smaller turn from the ship\'s heading', () => {
        for (const [angle, expected] of [[-Math.PI / 2, 1], [Math.PI / 2, -1]] as const) {
            const { addRaider, place, ship, runShip, playOn, position } = createRelativeWorld();
            const raider = addRaider(10, 0);
            place(ship, 0, 0, angle);

            expect(playOn('orbit', raider).played).toBe(true);
            runShip(4000);
            expect(Math.sign(position().y)).toBe(expected);
        }
    });

    it('follows the target as it moves', () => {
        const { addRaider, fly, runShip, playOn, rangeTo } = createRelativeWorld();
        const raider = addRaider(10, 0);
        fly(raider, 0, 1, 1);

        playOn('orbit', raider);
        runShip(6000);
        expect(rangeTo(raider)).toBeGreaterThan(9.4);
        expect(rangeTo(raider)).toBeLessThan(10.4);
    });

    it('cannot be played on a ship it is almost touching, or on itself', () => {
        const { ship, helm, addRaider, playOn } = createRelativeWorld();

        expect(playOn('orbit', addRaider(1, 0)).played).toBe(false);
        expect(helm.activeManeuver).toBeNull();
        expect(playOn('orbit', ship).played).toBe(false);
    });

    it('stops as soon as it is called off, or the target is lost', () => {
        const { state, helm, addRaider, runShip, playOn, position } = createRelativeWorld();
        const raider = addRaider(10, 0);

        playOn('orbit', raider);
        runShip(1000);
        helm.cancelActiveManeuver();
        runShip(100);
        expect(helm.activeManeuver).toBeNull();
        runShip(1000);
        const stoppedAt = position();
        runShip(2000);
        expect(position().x).toBeCloseTo(stoppedAt.x, 5);
        expect(position().y).toBeCloseTo(stoppedAt.y, 5);

        playOn('orbit', raider);
        runShip(1000);
        state.remove(raider);
        runShip(200);
        expect(helm.activeManeuver).toBeNull();
    });

    it('gains 1 Momentum for every 3 seconds spent circling', () => {
        const { addRaider, runShip, playOn, momentum } = createRelativeWorld();
        const raider = addRaider(10, 0);

        playOn('orbit', raider);
        expect(momentum()).toBe(0);

        runShip(2800);
        expect(momentum()).toBe(0);

        runShip(300);
        expect(momentum()).toBe(1);

        runShip(3000);
        expect(momentum()).toBe(2);

        runShip(3000);
        expect(momentum()).toBe(3);
    });

    it('gains no Momentum once it is called off', () => {
        const { helm, addRaider, runShip, playOn, momentum } = createRelativeWorld();
        const raider = addRaider(10, 0);

        playOn('orbit', raider);
        runShip(1000);
        helm.cancelActiveManeuver();
        runShip(6000);
        expect(momentum()).toBe(0);
    });
});

describe('Circle Strafe', () => {
    it('circles the target at the range it started at, facing it all the way round, for 8 seconds', () => {
        const { helm, addRaider, runShip, playOn, position, offsetFrom, rangeTo, momentum } = createRelativeWorld();
        expect(cardDefinitions.circleStrafe).toMatchObject({ targetType: 'ship', targetRelationship: 'hostile', rarity: 'rare', system: 'helm', parameters: { cost: 5, evasion: 15, duration: 8 } });
        expect(getCardDefinition('circleStrafe').synergy).toBeUndefined();

        const raider = addRaider(10, 0);
        const { card, played } = playOn('circleStrafe', raider);
        expect(played).toBe(true);
        expect(helm.activeManeuver!.card).toBe(card);
        expect(helm.activeManeuver!.endTime - helm.activeManeuver!.startTime).toBe(8000);
        expect(helm.evasion).toBe(15);

        // It turns round to face the raider at the turn rate (the ship starts out facing it already), then holds that as it circles.
        for (let elapsed = 0; elapsed < 7800; elapsed += 100) {
            runShip(100);
            expect(rangeTo(raider)).toBeGreaterThan(9.4);
            expect(rangeTo(raider)).toBeLessThan(10.4);

            // A ship's angle goes the opposite way round to Math.atan2's.
            const toRaider = Math.atan2(-offsetFrom(raider).y, -offsetFrom(raider).x);
            expect(Math.cos(position().angle + toRaider)).toBeGreaterThan(0.9);
        }
        expect(helm.activeManeuver).not.toBeNull();

        // It has gone about 0.8 of a radian round.
        const gone = Math.PI - Math.abs(Math.atan2(offsetFrom(raider).y, offsetFrom(raider).x));
        expect(gone).toBeGreaterThan(0.6);
        expect(gone).toBeLessThan(1);

        runShip(300);
        expect(helm.activeManeuver).toBeNull();
        expect(helm.deck.filter(candidate => candidate === card)).toHaveLength(1);

        // Unlike Orbit, it builds no Momentum.
        expect(momentum()).toBe(0);
    });

    it('cannot be played on a friendly ship, or one it is almost touching', () => {
        const { helm, other, addRaider, playOn } = createRelativeWorld();

        expect(playOn('circleStrafe', other).played).toBe(false);
        expect(playOn('circleStrafe', addRaider(1, 0)).played).toBe(false);
        expect(helm.activeManeuver).toBeNull();
    });

    it('stops as soon as it is called off, or the target is lost', () => {
        const { state, helm, addRaider, runShip, playOn } = createRelativeWorld();
        const raider = addRaider(10, 0);

        playOn('circleStrafe', raider);
        runShip(1000);
        helm.cancelActiveManeuver();
        runShip(100);
        expect(helm.activeManeuver).toBeNull();

        playOn('circleStrafe', raider);
        runShip(1000);
        state.remove(raider);
        runShip(200);
        expect(helm.activeManeuver).toBeNull();
    });
});

describe('Interpose', () => {
    it('holds the point between a friendly ship and the hostile ship closest to it, for 8 seconds', () => {
        const { helm, other, addRaider, place, runShip, playOn, position } = createRelativeWorld();
        expect(cardDefinitions.interpose).toMatchObject({ targetType: 'ship', targetRelationship: 'friendly', system: 'helm', rarity: 'uncommon', parameters: { cost: 2, evasion: 0, duration: 8 } });

        place(other, 4, 0);
        const raider = addRaider(4, 6);
        const { card, played } = playOn('interpose', other);
        expect(played).toBe(true);
        expect(helm.activeManeuver!.endTime - helm.activeManeuver!.startTime).toBe(8000);

        // It sits 3 units out from the friendly ship, on the line to the raider, facing it.
        runShip(4000);
        expect(position().x).toBeCloseTo(4, 1);
        expect(position().y).toBeCloseTo(3, 1);
        expect(position().angle).toBeCloseTo(-Math.PI / 2, 1);

        // A closer raider takes over, and the ship holds half way between that one and the friendly ship.
        addRaider(4, -3);
        runShip(3300);
        expect(position().x).toBeCloseTo(4, 1);
        expect(position().y).toBeCloseTo(-1.5, 1);

        // The raider that was first is out of the picture, wherever it goes.
        place(raider, 100, 100);
        runShip(900);
        expect(helm.activeManeuver).toBeNull();
        expect(helm.deck.filter(candidate => candidate === card)).toHaveLength(1);
        expect(position().y).toBeCloseTo(-1.5, 1);
    });

    it('stays put when there is no hostile ship', () => {
        const { other, place, runShip, playOn, position, helm } = createRelativeWorld();
        place(other, 4, 0);

        expect(playOn('interpose', other).played).toBe(true);
        runShip(3000);
        expect(helm.activeManeuver).not.toBeNull();
        expect(position()).toMatchObject({ x: 0, y: 0, angle: 0 });
    });

    it('can only be played on friendly ships', () => {
        const { helm, addRaider, ship, playOn } = createRelativeWorld();

        expect(playOn('interpose', addRaider(5, 0)).played).toBe(false);
        expect(playOn('interpose', ship).played).toBe(false);
        expect(helm.activeManeuver).toBeNull();
    });

    it('stops as soon as it is called off, or the target is lost', () => {
        const { state, helm, other, addRaider, place, runShip, playOn, position } = createRelativeWorld();
        place(other, 4, 0);
        addRaider(4, 6);

        playOn('interpose', other);
        runShip(1000);
        helm.cancelActiveManeuver();
        runShip(100);
        expect(helm.activeManeuver).toBeNull();
        runShip(1000);
        const stoppedAt = position();
        runShip(2000);
        expect(position().y).toBeCloseTo(stoppedAt.y, 5);

        playOn('interpose', other);
        runShip(1000);
        state.remove(other);
        runShip(200);
        expect(helm.activeManeuver).toBeNull();
    });
});

describe('Shadow', () => {
    it('gets behind the target and stays there, facing it, for 8 seconds', () => {
        const { state, helm, other, addRaider, fly, place, runShip, playOn, position, offsetFrom } = createRelativeWorld();
        expect(cardDefinitions.shadow).toMatchObject({ targetType: 'ship', targetRelationship: 'hostile', system: 'helm', rarity: 'uncommon', parameters: { cost: 2, evasion: 10, duration: 8 } });
        place(other, 0, 40);

        // The raider is heading in the direction of +y.
        const raider = addRaider(5, 0, -Math.PI / 2);
        const { card, played } = playOn('shadow', raider);
        expect(played).toBe(true);
        expect(helm.activeManeuver!.card).toBe(card);
        expect(helm.activeManeuver!.endTime - helm.activeManeuver!.startTime).toBe(8000);
        expect(helm.evasion).toBe(10);

        runShip(4000);
        expect(offsetFrom(raider).x).toBeCloseTo(0, 1);
        expect(offsetFrom(raider).y).toBeCloseTo(-2.5, 1);
        expect(position().angle).toBeCloseTo(-Math.PI / 2, 1);

        // It keeps up as the raider flies off, and moves round as the raider turns.
        fly(raider, 0, 1, 1);
        runShip(800);
        expect(offsetFrom(raider).x).toBeCloseTo(0, 1);
        expect(offsetFrom(raider).y).toBeCloseTo(-2.5, 1);

        const at = raider.getPosition(state.currentTime);
        place(raider, at.x, at.y, 0);
        runShip(2800);
        expect(offsetFrom(raider).x).toBeCloseTo(-2.5, 1);
        expect(offsetFrom(raider).y).toBeCloseTo(0, 1);
        expect(helm.activeManeuver).not.toBeNull();

        runShip(600);
        expect(helm.activeManeuver).toBeNull();
        expect(helm.deck.filter(candidate => candidate === card)).toHaveLength(1);
    });

    it('can only be played on hostile ships', () => {
        const { helm, other, ship, playOn } = createRelativeWorld();

        expect(playOn('shadow', other).played).toBe(false);
        expect(playOn('shadow', ship).played).toBe(false);
        expect(helm.activeManeuver).toBeNull();
    });

    it('stops as soon as it is called off, or the target is lost', () => {
        const { state, helm, addRaider, runShip, playOn, position } = createRelativeWorld();
        const raider = addRaider(10, 0);

        playOn('shadow', raider);
        runShip(1000);
        helm.cancelActiveManeuver();
        runShip(100);
        expect(helm.activeManeuver).toBeNull();
        runShip(1000);
        const stoppedAt = position();
        expect(stoppedAt.x).toBeGreaterThan(0.5);
        runShip(2000);
        expect(position().x).toBeCloseTo(stoppedAt.x, 5);

        playOn('shadow', raider);
        runShip(1000);
        state.remove(raider);
        runShip(200);
        expect(helm.activeManeuver).toBeNull();
    });
});

describe('Break Away', () => {
    it('turns away from the target, then burns 6 units directly away from it, gaining 1 Momentum', () => {
        const { helm, other, place, addRaider, runShip, playOn, position, momentum } = createRelativeWorld();
        expect(cardDefinitions.breakAway).toMatchObject({ targetType: 'ship', targetRelationship: 'hostile', system: 'helm', parameters: { cost: 2, evasion: 20, distance: 6, momentum: 1 } });
        expect(cardDefinitions.breakAway).not.toHaveProperty('rarity');
        expect(getCardDefinition('breakAway').synergy).toEqual({ provides: ['momentum'] });
        place(other, 0, 40);

        // The raider is ahead and to the side, so away from it is back and to the side.
        const raider = addRaider(8, 6);
        const { card, played } = playOn('breakAway', raider);
        expect(played).toBe(true);
        expect(helm.activeManeuver!.card).toBe(card);
        expect(helm.evasion).toBe(20);
        expect(momentum()).toBe(1);

        // Turning round takes the better part of 3 seconds, then 6 units at 1.5 a second takes 4.
        const duration = helm.activeManeuver!.endTime - helm.activeManeuver!.startTime;
        // A ship's angle goes the opposite way round to Math.atan2's.
        const heading = -Math.atan2(-6, -8);
        const turn = Math.abs(heading) / Math.PI * 4000;
        expect(duration).toBeCloseTo(turn + 4000, 0);

        runShip(turn - 100);
        expect(position().x).toBeCloseTo(0, 5);
        expect(helm.activeManeuver).not.toBeNull();

        runShip(duration - turn + 200);
        expect(helm.activeManeuver).toBeNull();
        expect(position().x).toBeCloseTo(-4.8, 1);
        expect(position().y).toBeCloseTo(-3.6, 1);
        expect(position().angle).toBeCloseTo(heading, 2);
        expect(helm.deck.filter(candidate => candidate === card)).toHaveLength(1);
    });

    it('needs no turn when the target is already behind, and makes the next maneuver faster', () => {
        const { addRaider, runShip, playOn, helm, momentum } = createRelativeWorld();
        const raider = addRaider(-10, 0);

        playOn('breakAway', raider);
        expect(helm.activeManeuver!.endTime - helm.activeManeuver!.startTime).toBeCloseTo(4000);
        while (helm.activeManeuver) {
            runShip(100);
        }
        expect(momentum()).toBe(1);
    });

    it('plans once, so keeps going if the target is lost, and can be called off', () => {
        const { state, ship, helm, addRaider, runShip, playOn, position } = createRelativeWorld();
        const raider = addRaider(-10, 0);

        playOn('breakAway', raider);
        runShip(500);
        state.remove(raider);
        runShip(1000);
        expect(helm.activeManeuver).not.toBeNull();
        expect(position().x).toBeGreaterThan(1);

        helm.cancelActiveManeuver();
        runShip(100);
        expect(helm.activeManeuver).toBeNull();
        runShip(1000);
        const stoppedAt = position().x;
        expect(stoppedAt).toBeLessThan(6);
        runShip(2000);
        expect(ship.getPosition(state.currentTime).x).toBeCloseTo(stoppedAt, 5);
    });

    it('can only be played on hostile ships', () => {
        const { helm, other, ship, playOn, momentum } = createRelativeWorld();

        expect(playOn('breakAway', other).played).toBe(false);
        expect(playOn('breakAway', ship).played).toBe(false);
        expect(helm.activeManeuver).toBeNull();
        expect(momentum()).toBe(0);
    });
});

describe('Attack Run', () => {
    /** A ship as `createRelativeWorld` makes, with a raider 12 units ahead of it, and the power that tactical has to start with. */
    function createRunningShip() {
        const world = createRelativeWorld();
        const raider = world.addRaider(12, 0);
        const tactical = world.ship.tacticalState;
        tactical.adjustPowerLevel(-3);
        return { ...world, raider, tactical };
    }

    it('turns to the target and flies fast straight at it, stopping 3 units short, and gives tactical 1 more power as it does', () => {
        const { helm, tactical, raider, playOn, runShip, position, rangeTo } = createRunningShip();
        expect(cardDefinitions.attackRun).toMatchObject({ targetType: 'ship', targetRelationship: 'hostile', system: 'helm', rarity: 'uncommon', parameters: { cost: 3, evasion: 15, duration: 8, power: 1 } });
        expect(cardDefinitions.attackRun.parameters).not.toHaveProperty('costReduction');
        expect(getCardDefinition('attackRun').synergy).toBeUndefined();
        const startingPower = tactical.powerLevel;

        const { card, played } = playOn('attackRun', raider);
        expect(played).toBe(true);
        expect(helm.activeManeuver!.card).toBe(card);
        expect(helm.activeManeuver!.endTime - helm.activeManeuver!.startTime).toBe(8000);
        expect(helm.evasion).toBe(15);
        expect(tactical.hasEffect('attackRun')).toBe(true);
        expect(tactical.powerLevel).toBe(startingPower + 1);

        // It flies at 1.5 units a second, straight along the line to the raider.
        runShip(2000);
        expect(position().x).toBeGreaterThan(2.5);
        expect(position().x).toBeLessThan(3.2);
        expect(position().y).toBeCloseTo(0, 3);
        expect(position().angle).toBeCloseTo(0, 3);

        // It has stopped 3 units short of the raider by the time it ends, and doesn't go any closer.
        runShip(4500);
        expect(helm.activeManeuver).not.toBeNull();
        expect(rangeTo(raider)).toBeCloseTo(3, 1);
        expect(tactical.powerLevel).toBe(startingPower + 1);

        runShip(1600);
        expect(helm.activeManeuver).toBeNull();
        expect(rangeTo(raider)).toBeCloseTo(3, 1);
        expect(helm.deck.includes(card)).toBe(true);
        expect(tactical.hasEffect('attackRun')).toBe(false);
        expect(tactical.powerLevel).toBe(startingPower);
    });

    it('turns to face a target that is off to the side, and tracks it as it moves', () => {
        const { addRaider, fly, runShip, playOn, position, rangeTo } = createRunningShip();
        const raider = addRaider(0, -20);
        fly(raider, 1, 0, 0.5);

        playOn('attackRun', raider);
        runShip(2500);
        // It turned the 90 degrees at 45 degrees a second, and now points at where the raider has moved to.
        expect(position().angle).toBeGreaterThan(Math.PI / 2 - 0.5);
        expect(position().angle).toBeLessThan(Math.PI / 2);

        // It is closing on the raider, which is still ahead of it.
        expect(position().y).toBeLessThan(-1);
        expect(rangeTo(raider)).toBeLessThan(19);
    });

    it('stays where it is if the target is already inside the stop distance', () => {
        const { addRaider, runShip, playOn, position } = createRunningShip();
        const raider = addRaider(2, 0);

        expect(playOn('attackRun', raider).played).toBe(true);
        runShip(2000);
        expect(position().x).toBeCloseTo(0, 3);
    });

    it('stops giving tactical power the moment it is called off', () => {
        const { helm, tactical, raider, playOn, runShip } = createRunningShip();
        const startingPower = tactical.powerLevel;

        playOn('attackRun', raider);
        runShip(1000);
        helm.cancelActiveManeuver();
        runShip(100);

        expect(helm.activeManeuver).toBeNull();
        expect(tactical.hasEffect('attackRun')).toBe(false);
        expect(tactical.powerLevel).toBe(startingPower);
    });

    it('is called off, with the power, when the target is lost', () => {
        const { state, helm, tactical, raider, playOn, runShip } = createRunningShip();
        const startingPower = tactical.powerLevel;

        playOn('attackRun', raider);
        runShip(1000);
        state.remove(raider);
        runShip(200);

        expect(helm.activeManeuver).toBeNull();
        expect(tactical.powerLevel).toBe(startingPower);
    });

    it('does not pile up power when another maneuver replaces it', () => {
        const { tactical, raider, playOn, runShip, play } = createRunningShip();
        const startingPower = tactical.powerLevel;

        playOn('attackRun', raider);
        runShip(1000);
        expect(playOn('attackRun', raider).played).toBe(true);
        expect(tactical.powerLevel).toBe(startingPower + 1);

        expect(play('burn', '5,5').played).toBe(true);
        expect(tactical.powerLevel).toBe(startingPower);
    });

    it('does nothing if it cannot be played, and leaves tactical\'s card costs alone', () => {
        const { ship, other, helm, tactical, playOn } = createRunningShip();
        const startingPower = tactical.powerLevel;

        // A friendly ship is not a target for it, and neither is the ship itself.
        expect(playOn('attackRun', other).played).toBe(false);
        expect(playOn('attackRun', ship).played).toBe(false);
        expect(helm.activeManeuver).toBeNull();
        expect(tactical.hasEffect('attackRun')).toBe(false);
        expect(tactical.powerLevel).toBe(startingPower);
    });

    it('is left alone by the AI', () => {
        expect(getCardEvaluator('attackRun')).toBeUndefined();
    });
});

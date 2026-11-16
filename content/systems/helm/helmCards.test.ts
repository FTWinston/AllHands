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
    setup.hull = { ...setup.hull, cards: new Array<'exampleNoTarget'>(10).fill('exampleNoTarget') };
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

describe('the new helm cards', () => {
    it('are sold by shops, apart from the options of the choice cards', () => {
        const shop = getShopCardTypes('helm');
        expect(shop).toEqual(expect.arrayContaining(['burn', 'flyby', 'hardBrake', 'evasivePattern', 'holdSteady', 'broadside', 'slingshot', 'brace', 'lockOn']));

        for (const option of ['broadsideLeft', 'broadsideRight', 'slingshotLeft', 'slingshotRight'] as const) {
            expect(shop).not.toContain(option);
        }
    });

    it('can be played by the AI when they move the ship, and are left alone by it otherwise', () => {
        for (const type of ['burn', 'flyby', 'broadside', 'broadsideLeft', 'broadsideRight', 'slingshot', 'slingshotLeft', 'slingshotRight'] as const) {
            expect(getCardEvaluator(type)).toBeDefined();
        }
        for (const type of ['hardBrake', 'evasivePattern', 'holdSteady', 'brace', 'lockOn', 'matchCourse'] as const) {
            expect(getCardEvaluator(type)).toBeUndefined();
        }
    });
});

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

describe('Flyby', () => {
    it('is an ordinary straight move with no Momentum', () => {
        const { helm, play, maneuverDuration, momentum } = createShip();
        expect(cardDefinitions.flyby).toMatchObject({ targetType: 'location', system: 'helm', baseSpeed: 1, parameters: { cost: 2, evasion: 10, speedPerMomentum: 15, evasionPerMomentum: 8 } });

        expect(play('flyby', '6,0').played).toBe(true);
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
        const { card, played } = play('flyby', '12,0');
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

        play('flyby', '12,0');
        expect(momentum()).toBe(1);
    });
});

describe('Hard Brake', () => {
    it('stops the ship, and spends all Momentum on evasion for 5 seconds', () => {
        const { state, ship, other, helm, play, run, momentum, effectLevel, accuracy } = createShip();
        expect(cardDefinitions.hardBrake).toMatchObject({ targetType: 'no-target', system: 'helm', parameters: { cost: 1, evasionPerMomentum: 10, duration: 5 } });

        play('burn', '9,0');
        helm.adjustEffectLevel('momentum', 1);
        run(2000);

        const { card, played } = play('hardBrake');
        expect(played).toBe(true);
        expect(helm.deck.includes(card)).toBe(true);
        expect(momentum()).toBe(0);
        expect(effectLevel('helm', 'hardBrakeEvasion')).toBe(30);

        // The maneuver is called off, and the ship slows to a stop well short of where it was going.
        run(1000);
        expect(helm.activeManeuver).toBeNull();
        const stopped = ship.getPosition(state.currentTime);
        expect(stopped.x).toBeLessThan(5);
        run(1000);
        expect(ship.getPosition(state.currentTime).x).toBeCloseTo(stopped.x);

        expect(helm.evasion).toBe(30);
        expect(accuracy(other, ship)).toBe(70);

        run(3100);
        expect(effectLevel('helm', 'hardBrakeEvasion')).toBe(0);
        expect(helm.evasion).toBe(0);
        expect(accuracy(other, ship)).toBe(100);
    });

    it('gives no evasion without Momentum', () => {
        const { helm, play, effectLevel } = createShip();

        expect(play('hardBrake').played).toBe(true);
        expect(effectLevel('helm', 'hardBrakeEvasion')).toBe(0);
        expect(helm.evasion).toBe(0);
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

describe('Hold Steady', () => {
    it('stays put for 6 seconds with no evasion, and makes the weapons more accurate', () => {
        const { state, ship, other, helm, play, run, effectLevel, accuracy } = createShip();
        expect(cardDefinitions.holdSteady).toMatchObject({ targetType: 'no-target', system: 'helm', parameters: { cost: 1, evasion: 0, accuracy: 20, duration: 6 } });

        // The other ship is flying something that makes it harder to hit.
        other.helmState.evasionModifier = 30;
        expect(accuracy(ship, other)).toBe(70);

        const { card, played } = play('holdSteady');
        expect(played).toBe(true);
        expect(helm.activeManeuver!.card).toBe(card);
        expect(helm.evasion).toBe(0);
        expect(effectLevel('helm', 'holdingSteady')).toBe(20);
        expect(accuracy(ship, other)).toBe(90);

        run(5900);
        expect(helm.activeManeuver).not.toBeNull();
        expect(ship.getPosition(state.currentTime)).toMatchObject({ x: 0, y: 0, angle: 0 });
        expect(accuracy(ship, other)).toBe(90);

        run(200);
        expect(helm.activeManeuver).toBeNull();
        expect(helm.deck.filter(candidate => candidate === card)).toHaveLength(1);
        expect(effectLevel('helm', 'holdingSteady')).toBe(0);
        expect(accuracy(ship, other)).toBe(70);
    });

    it('stops steadying the weapons as soon as the ship flies something else', () => {
        const { ship, other, play, run, effectLevel, accuracy } = createShip();
        other.helmState.evasionModifier = 30;

        play('holdSteady');
        run(1000);
        expect(play('burn', '6,0').played).toBe(true);

        expect(effectLevel('helm', 'holdingSteady')).toBe(0);
        expect(accuracy(ship, other)).toBe(70);
    });

    it('loses Momentum, as the ship is still for longer than 2 seconds', () => {
        const { play, run, momentum, runUntilManeuverEnds } = createShip();

        play('burn', '6,0');
        runUntilManeuverEnds();
        play('holdSteady');
        expect(momentum()).toBeGreaterThan(0);

        run(2200);
        expect(momentum()).toBe(0);
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
        expect(cardDefinitions.slingshotLeft).toMatchObject({ targetType: 'location', baseSpeed: 1.25, minDistance: 3, parameters: { cost: 3, evasion: 30, momentum: 1 } });

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

describe('Brace', () => {
    it('stays put for 4 seconds, halving the damage of hits on the hull', () => {
        const { state, ship, helm, play, run, effectLevel } = createShip();
        expect(cardDefinitions.brace).toMatchObject({ targetType: 'no-target', system: 'helm', parameters: { cost: 1, evasion: 0, hullDamageReduction: 50, duration: 4 } });
        expect(ship.hullState.health).toBe(10);

        const { card, played } = play('brace');
        expect(played).toBe(true);
        expect(helm.activeManeuver!.card).toBe(card);
        expect(effectLevel('hull', 'braced')).toBe(50);

        ship.hullState.applyDamage.invoke(4);
        expect(ship.hullState.health).toBe(8);

        // Other systems are hit as hard as ever.
        const tacticalHealth = ship.tacticalState.health;
        ship.tacticalState.applyDamage.invoke(1);
        expect(ship.tacticalState.health).toBe(tacticalHealth - 1);

        run(3900);
        expect(helm.activeManeuver).not.toBeNull();
        expect(ship.getPosition(state.currentTime)).toMatchObject({ x: 0, y: 0, angle: 0 });

        run(200);
        expect(helm.activeManeuver).toBeNull();
        expect(effectLevel('hull', 'braced')).toBe(0);
        ship.hullState.applyDamage.invoke(4);
        expect(ship.hullState.health).toBe(4);
    });

    it('stops protecting the hull as soon as it is called off', () => {
        const { state, helm, play, run, effectLevel } = createShip();

        play('brace');
        run(1000);
        helm.cancelActiveManeuver();
        state.tick(100);

        expect(effectLevel('hull', 'braced')).toBe(0);
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
        const { state, ship } = world;

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

        return { ...world, addRaider, moveTo, runShip, angle };
    }

    it('turns on the spot to face the closest hostile ship, 45 degrees a second, for 8 seconds', () => {
        const { state, ship, helm, play, addRaider, runShip, angle } = createLockingShip();
        expect(cardDefinitions.lockOn).toMatchObject({ targetType: 'no-target', system: 'helm', parameters: { cost: 2, evasion: 0, duration: 8 } });

        // The friendly ship ahead and the more distant raider behind are ignored.
        addRaider(0, 10);
        addRaider(-20, 0);

        const { card, played } = play('lockOn');
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

    it('follows a hostile ship as it moves, and turns to another that comes closer', () => {
        const { play, addRaider, moveTo, runShip, angle } = createLockingShip();
        const ahead = addRaider(10, 0);
        const behind = addRaider(-20, 0);

        play('lockOn');
        runShip(1000);
        expect(angle()).toBeCloseTo(0, 2);

        // The raider ahead slips round to the right.
        moveTo(ahead, 0, 10);
        runShip(2500);
        expect(angle()).toBeCloseTo(Math.PI / 2, 2);

        // The other raider comes in close behind.
        moveTo(behind, -3, 0);
        runShip(4000);
        expect(Math.abs(angle() % (Math.PI * 2))).toBeCloseTo(Math.PI, 2);
    });

    it('stops turning as soon as it is called off', () => {
        const { helm, play, addRaider, runShip, angle } = createLockingShip();
        addRaider(0, 10);

        play('lockOn');
        runShip(500);
        helm.cancelActiveManeuver();
        runShip(100);
        expect(helm.activeManeuver).toBeNull();

        runShip(1000);
        const stoppedAt = angle();
        expect(stoppedAt).toBeGreaterThan(0.1);
        expect(stoppedAt).toBeLessThan(Math.PI / 4);

        runShip(2000);
        expect(angle()).toBe(stoppedAt);
    });

    it('holds its heading with no hostile ship about', () => {
        const { state, ship, helm, play, runShip } = createLockingShip();

        expect(play('lockOn').played).toBe(true);
        runShip(4000);
        expect(helm.activeManeuver).not.toBeNull();
        expect(ship.getPosition(state.currentTime)).toMatchObject({ x: 0, y: 0, angle: 0 });

        runShip(4100);
        expect(helm.activeManeuver).toBeNull();
        expect(ship.getPosition(state.currentTime)).toMatchObject({ x: 0, y: 0, angle: 0 });
    });
});

describe('Match Course', () => {
    /**
     * A ship as `createShip` makes, which knows of the other ship, with a way to set that ship flying straight at a steady speed.
     * Only the player's ship is ticked, so the other ship only moves as it's told to.
     */
    function createMatchingShip() {
        const world = createShip();
        const { state, ship, other, helm } = world;
        ship.updateKnownObjects(state.currentTime);

        /** Has the other ship fly from where it is in the given direction, at the given speed in units per second, for the next 20 seconds. A keyframe every 100ms keeps its speed steady. */
        const flyOther = (dx: number, dy: number, speed: number) => {
            const from = other.getPosition(state.currentTime);
            const length = Math.hypot(dx, dy);
            const keyframes = Array.from({ length: 201 }, (_, step) => new MotionKeyframe(
                state.currentTime + step * 100,
                from.x + dx / length * speed * step / 10,
                from.y + dy / length * speed * step / 10,
                from.angle
            ));
            other.setMotion(...keyframes);
        };
        const runShip = (duration: number) => {
            for (let t = 0; t < duration; t += 100) {
                state.currentTime += 100;
                ship.tick(100, state.currentTime);
            }
        };
        const playOn = (targetId: string) => {
            const card = new CardState(ship.getCardId(), 'matchCourse');
            helm.addCardToHand(card);
            return { card, played: helm.playCard(card.id, 'matchCourse', 'ship', targetId) !== null };
        };
        const position = () => ship.getPosition(state.currentTime);
        const offset = () => {
            const own = position();
            const target = other.getPosition(state.currentTime);
            return { x: own.x - target.x, y: own.y - target.y };
        };

        return { ...world, flyOther, runShip, playOn, position, offset };
    }

    it('keeps the ship at its offset from the target as the target moves, for 8 seconds', () => {
        const { helm, other, flyOther, runShip, playOn, offset, position } = createMatchingShip();
        expect(cardDefinitions.matchCourse).toMatchObject({ targetType: 'ship', system: 'helm', rarity: 'uncommon', parameters: { cost: 2, evasion: 0, duration: 8 } });
        expect(cardDefinitions.matchCourse).not.toHaveProperty('targetRelationship');

        flyOther(0, 1, 1);
        const { card, played } = playOn(other.id);
        expect(played).toBe(true);
        expect(helm.activeManeuver!.card).toBe(card);
        expect(helm.activeManeuver!.endTime - helm.activeManeuver!.startTime).toBe(8000);

        runShip(4000);
        expect(offset().x).toBeCloseTo(-10, 1);
        expect(offset().y).toBeCloseTo(0, 1);
        expect(position().y).toBeGreaterThan(3.5);

        // The target turns and heads the other way: the ship follows it there.
        flyOther(1, -1, 1);
        runShip(3500);
        expect(offset().x).toBeCloseTo(-10, 1);
        expect(offset().y).toBeCloseTo(0, 1);
        expect(helm.activeManeuver).not.toBeNull();

        runShip(600);
        expect(helm.activeManeuver).toBeNull();
        expect(helm.deck.filter(candidate => candidate === card)).toHaveLength(1);

        // Once it's over, the ship stops following.
        const stoppedAt = position();
        runShip(2000);
        expect(position().x).toBeCloseTo(stoppedAt.x, 2);
        expect(position().y).toBeCloseTo(stoppedAt.y, 2);
    });

    it('falls behind a target that moves faster than it can', () => {
        const { other, flyOther, runShip, playOn, position } = createMatchingShip();

        flyOther(0, 1, 3);
        playOn(other.id);
        runShip(2000);

        // It can manage 1.5 units a second, where the target makes 3.
        expect(position().y).toBeGreaterThan(2.5);
        expect(position().y).toBeLessThan(3.1);
    });

    it('turns to the target\'s heading', () => {
        const { state, other, runShip, playOn, position } = createMatchingShip();
        other.setMotion(new MotionKeyframe(state.currentTime, 10, 0, Math.PI / 2));

        playOn(other.id);
        runShip(1000);
        expect(position().angle).toBeGreaterThan(Math.PI / 4 - 0.15);
        expect(position().angle).toBeLessThan(Math.PI / 4 + 0.05);

        runShip(1500);
        expect(position().angle).toBeCloseTo(Math.PI / 2, 2);
    });

    it('stops following as soon as it is called off', () => {
        const { helm, other, flyOther, runShip, playOn, position } = createMatchingShip();

        flyOther(0, 1, 1);
        playOn(other.id);
        runShip(1000);
        helm.cancelActiveManeuver();
        runShip(100);
        expect(helm.activeManeuver).toBeNull();

        runShip(1000);
        const stoppedAt = position();
        expect(stoppedAt.y).toBeGreaterThan(0.5);
        expect(stoppedAt.y).toBeLessThan(2);

        runShip(2000);
        expect(position().y).toBeCloseTo(stoppedAt.y, 5);
    });

    it('is called off when the target is lost', () => {
        const { state, helm, other, flyOther, runShip, playOn } = createMatchingShip();

        flyOther(0, 1, 1);
        playOn(other.id);
        runShip(1000);
        state.remove(other);
        runShip(200);
        expect(helm.activeManeuver).toBeNull();
    });

    it('is left alone by the AI, and has no synergy within helm', () => {
        expect(getCardEvaluator('matchCourse')).toBeUndefined();
        expect(getCardDefinition('matchCourse').synergy).toBeUndefined();
        expect(getShopCardTypes('helm')).toContain('matchCourse');
    });
});

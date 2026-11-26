import { cardDefinitions, type CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { getShopCardTypes } from 'common-data/features/cards/utils/getShopCardTypes';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { clampAngle } from 'common-data/features/space/utils/vectors';
import { engageTractorBeam } from 'content/systems/tactical/effects/tacticalEffects.engine';
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
    /** Flies a slingshot round a raider 10 units ahead, from a ship that starts at the given heading, noting how far it has turned in all, and how close it gets. */
    function flySlingshot(heading: number, target: 'raider' | 'friend' = 'raider') {
        const world = createRelativeWorld();
        const { state, ship, helm, other, addRaider, place, runShip, playOn, position, rangeTo } = world;
        place(ship, 0, 0, heading);
        place(other, 10, 0);
        const aimedAt = target === 'raider' ? addRaider(10, 0) : other;

        const { played } = playOn('slingshot', aimedAt);
        expect(played).toBe(true);

        let unwrapped = position().angle;
        let previous = unwrapped;
        let turnedAtEntry: number | null = null;
        let closest = Infinity;
        while (helm.activeManeuver) {
            runShip(100);
            const angle = position().angle;
            unwrapped += clampAngle(angle - previous);
            previous = angle;
            closest = Math.min(closest, rangeTo(aimedAt));
            if (turnedAtEntry === null && rangeTo(aimedAt) < 2.3) {
                turnedAtEntry = unwrapped;
            }
        }

        return { ...world, state, aimedAt, closest, arcTurn: unwrapped - (turnedAtEntry ?? unwrapped) };
    }

    it('is a single ship-targeted card for any ship, with no choice and no AI', () => {
        expect(cardDefinitions.slingshot).toMatchObject({ targetType: 'ship', system: 'helm', rarity: 'uncommon', parameters: { cost: 3, evasion: 30, momentum: 2 } });
        expect(cardDefinitions.slingshot).not.toHaveProperty('targetRelationship');
        expect(cardDefinitions.slingshot).not.toHaveProperty('cards');
        expect(cardDefinitions).not.toHaveProperty('slingshotLeft');
        expect(cardDefinitions).not.toHaveProperty('slingshotRight');
        expect(getCardDefinition('slingshot').synergy).toEqual({ provides: ['momentum'] });
        expect(getCardEvaluator('slingshot')).toBeUndefined();
    });

    it('flies at the target, swings round it at close range, and heads back out clear of it, facing the way it is going', () => {
        // Heading a little to the +y side, so the swing goes round that side first.
        const { ship, state, aimedAt, closest, arcTurn, rangeTo, offsetFrom, helm, momentum } = flySlingshot(-0.4);

        expect(closest).toBeGreaterThan(1.6);
        expect(closest).toBeLessThan(2.4);
        // Round it through 180 degrees, as the angle grows, which is to the right of where it points.
        expect(arcTurn).toBeGreaterThan(Math.PI - 0.4);
        expect(arcTurn).toBeLessThan(Math.PI + 0.4);

        // It ends 4 units back along the line it came in on, on the far side from where it went in, facing back out.
        expect(offsetFrom(aimedAt).x).toBeCloseTo(-4, 0);
        expect(offsetFrom(aimedAt).y).toBeCloseTo(-2, 0);
        expect(rangeTo(aimedAt)).toBeGreaterThan(3.5);
        expect(Math.abs(clampAngle(ship.getPosition(state.currentTime).angle - Math.PI))).toBeLessThan(0.3);
        expect(helm.activeManeuver).toBeNull();
        expect(momentum()).toBeGreaterThanOrEqual(2);
    });

    it('swings round the other side when that needs less turning', () => {
        const { arcTurn, offsetFrom, aimedAt, closest } = flySlingshot(0.4);

        expect(closest).toBeLessThan(2.4);
        expect(arcTurn).toBeLessThan(-Math.PI + 0.4);
        expect(arcTurn).toBeGreaterThan(-Math.PI - 0.4);
        expect(offsetFrom(aimedAt).x).toBeCloseTo(-4, 0);
        expect(offsetFrom(aimedAt).y).toBeCloseTo(2, 0);
    });

    it('always goes the same way round when the target is dead ahead, and can be played on a friendly ship', () => {
        const first = flySlingshot(0);
        const second = flySlingshot(0, 'friend');

        expect(Math.sign(first.arcTurn)).toBe(Math.sign(second.arcTurn));
        expect(Math.abs(first.arcTurn)).toBeGreaterThan(Math.PI - 0.4);
        expect(Math.abs(second.arcTurn)).toBeGreaterThan(Math.PI - 0.4);
    });

    it('gains 2 Momentum and is hard to hit while flown', () => {
        const { helm, addRaider, playOn, momentum, runShip } = createRelativeWorld();

        const { card, played } = playOn('slingshot', addRaider(10, 0));
        expect(played).toBe(true);
        expect(helm.activeManeuver!.card).toBe(card);
        expect(helm.evasion).toBe(30);
        expect(momentum()).toBe(2);

        // Getting there at 1.25 units a second, swinging round and heading out again takes well over 8 seconds.
        expect(helm.activeManeuver!.endTime - helm.activeManeuver!.startTime).toBeGreaterThan(8000);
        runShip(1000);
        expect(helm.activeManeuver).not.toBeNull();
    });

    it('is refused if the ship is already within 2 units of the target', () => {
        const { helm, addRaider, playOn, momentum } = createRelativeWorld();

        expect(playOn('slingshot', addRaider(1.5, 0)).played).toBe(false);
        expect(helm.activeManeuver).toBeNull();
        expect(momentum()).toBe(0);
    });

    it('keeps its circle round a target that moves', () => {
        const { helm, addRaider, fly, playOn, runShip, rangeTo } = createRelativeWorld();
        const raider = addRaider(10, 0);
        fly(raider, 0, 1, 0.2);

        playOn('slingshot', raider);
        let closest = Infinity;
        while (helm.activeManeuver) {
            runShip(100);
            closest = Math.min(closest, rangeTo(raider));
        }

        expect(closest).toBeLessThan(2.6);
        expect(rangeTo(raider)).toBeGreaterThan(3.5);
        expect(rangeTo(raider)).toBeLessThan(5.5);
    });

    it('stops if the target is lost', () => {
        const { state, helm, addRaider, runShip, playOn } = createRelativeWorld();
        const raider = addRaider(10, 0);

        playOn('slingshot', raider);
        runShip(1000);
        state.remove(raider);
        runShip(200);
        expect(helm.activeManeuver).toBeNull();
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
        addRaider(0, -10);
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

        // The raider ahead slips round to the side.
        moveTo(ahead, 0, -10);
        runShip(2500);
        expect(angle()).toBeCloseTo(Math.PI / 2, 2);

        // The other raider comes in close behind.
        moveTo(behind, -3, 0);
        runShip(4000);
        expect(Math.abs(angle() % (Math.PI * 2))).toBeCloseTo(Math.PI, 2);
    });

    it('stops turning as soon as it is called off', () => {
        const { helm, play, addRaider, runShip, angle } = createLockingShip();
        addRaider(0, -10);

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
        expect(cardDefinitions.orbit).toMatchObject({ targetType: 'ship', system: 'helm', parameters: { cost: 2, evasion: 15, duration: 10 } });
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

    describe('rear arc bonus', () => {
        /** A raider with evasion of its own, which the ship is shadowing, and the chance of the ship's weapon hitting it. */
        function shadowRaider() {
            const world = createRelativeWorld();
            const raider = world.addRaider(5, 0, -Math.PI / 2);
            raider.helmState.evasionModifier = 30;
            const hitChance = () => (world.ship.tacticalState as unknown as { determineAccuracy: (target: GameObject, subTarget: undefined, weaponAccuracy: number) => number })
                .determineAccuracy(raider, undefined, 0);
            return { ...world, raider, hitChance };
        }

        it('ignores the evasion of the target only while within 60 degrees of straight behind it', () => {
            const { helm, ship, raider, place, playOn, runShip, hitChance } = shadowRaider();
            expect(cardDefinitions.shadow).toMatchObject({ parameters: { rearArc: 60 } });

            // Not behind it yet, so its evasion counts.
            expect(hitChance()).toBe(70);
            playOn('shadow', raider);
            expect(helm.hasEffect('shadowing')).toBe(true);
            expect(hitChance()).toBe(70);

            // Once it's behind, the evasion doesn't count.
            runShip(4000);
            expect(hitChance()).toBe(100);

            // Whichever way it turns, the ship doesn't count as behind it until it is, with the edges of the arc at 60 degrees.
            const at = raider.getPosition(ship.helmState.getGameState().currentTime);
            const hitAtBearing = (degrees: number) => {
                const radians = degrees * Math.PI / 180;
                // The ship sits 2.5 units from the raider at the bearing from straight behind it (the raider points along +y, so behind is -y).
                place(ship, at.x + Math.sin(radians) * 2.5, at.y - Math.cos(radians) * 2.5, 0);
                return hitChance();
            };
            expect(hitAtBearing(0)).toBe(100);
            expect(hitAtBearing(55)).toBe(100);
            expect(hitAtBearing(-55)).toBe(100);
            expect(hitAtBearing(65)).toBe(70);
            expect(hitAtBearing(-65)).toBe(70);
            expect(hitAtBearing(90)).toBe(70);
            expect(hitAtBearing(180)).toBe(70);
        });

        it('only counts for the ship being shadowed, and ends with the maneuver', () => {
            const { helm, other, raider, addRaider, playOn, runShip, hitChance } = shadowRaider();
            const second = addRaider(5, 0, -Math.PI / 2);
            second.helmState.evasionModifier = 30;
            const hitSecond = () => (helm.getShip().tacticalState as unknown as { determineAccuracy: (target: GameObject, subTarget: undefined, weaponAccuracy: number) => number })
                .determineAccuracy(second, undefined, 0);

            playOn('shadow', raider);
            runShip(4000);
            expect(hitChance()).toBe(100);
            // The same spot is behind the other raider too, but that isn't the one being shadowed.
            expect(hitSecond()).toBe(70);
            expect(other.helmState.hasEffect('shadowing')).toBe(false);

            helm.cancelActiveManeuver();
            runShip(100);
            expect(helm.hasEffect('shadowing')).toBe(false);
            expect(hitChance()).toBe(70);
        });

        it('lasts only as long as the maneuver, when it runs its course', () => {
            const { helm, raider, playOn, runShip, hitChance } = shadowRaider();

            playOn('shadow', raider);
            runShip(7000);
            expect(helm.hasEffect('shadowing')).toBe(true);
            runShip(1500);
            expect(helm.activeManeuver).toBeNull();
            expect(helm.hasEffect('shadowing')).toBe(false);
            expect(hitChance()).toBe(70);
        });
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

    describe('against a tractor beam and aiming weapons', () => {
        it('breaks free of a tractor beam it could not escape on power alone', () => {
            const { helm, ship, addRaider, play, playOn, runShip } = createRelativeWorld();
            const raider = addRaider(-6, 0);
            raider.tacticalState.adjustPowerLevel(5);
            expect(helm.powerLevel).toBeLessThanOrEqual(raider.tacticalState.powerLevel);

            expect(engageTractorBeam(raider, ship, 8, 60, 25)).toBe(true);
            expect(helm.hasEffect('heldByTractorBeam')).toBe(true);

            // An ordinary maneuver doesn't get it out: the holder has as much power at its tactical as the helm has.
            expect(play('slowAndSteady', '3,0').played).toBe(true);
            expect(helm.hasEffect('heldByTractorBeam')).toBe(true);
            const { played } = playOn('breakAway', raider);
            expect(played).toBe(true);
            expect(helm.hasEffect('heldByTractorBeam')).toBe(false);
            expect(raider.helmState.hasEffect('tractorBeamEngaged')).toBe(false);

            // It flies as fast as if it had never been held: 6 units at 1.5 a second, with Momentum's speed-up not yet counted.
            expect(helm.activeManeuver!.endTime - helm.activeManeuver!.startTime).toBeCloseTo(4000);
            runShip(4100);
            expect(helm.activeManeuver).toBeNull();
        });

        it('breaks free of the beam whichever ship holds it, and plays as usual when there is none', () => {
            const { helm, ship, addRaider, playOn } = createRelativeWorld();
            const raider = addRaider(-6, 0);
            const holder = addRaider(-5, 3);
            holder.tacticalState.adjustPowerLevel(5);

            expect(engageTractorBeam(holder, ship, 8, 60, 25)).toBe(true);
            expect(playOn('breakAway', raider).played).toBe(true);
            expect(helm.hasEffect('heldByTractorBeam')).toBe(false);
            expect(holder.helmState.hasEffect('tractorBeamEngaged')).toBe(false);

            // With nothing holding it, there's nothing to break free of.
            helm.cancelActiveManeuver();
            expect(playOn('breakAway', raider).played).toBe(true);
        });

        it('makes the target lose any Lock it had on the ship, and cumbersome weapons start their aim over', () => {
            const { ship, other, addRaider, playOn, runShip } = createRelativeWorld();
            const raider = addRaider(8, 0);
            const bystander = addRaider(0, 8);
            const tactical = raider.tacticalState;
            expect(tactical.slots.length).toBeGreaterThan(0);

            expect(tactical.addLock(ship, 3)).toBe(true);
            tactical.slots[0].aimStartTimes.set(ship.id, 0);
            tactical.slots[0].aimStartTimes.set(other.id, 0);

            expect(playOn('breakAway', raider).played).toBe(true);
            expect(tactical.lockLevel).toBe(0);
            expect(tactical.lockTargetId).toBe('');
            expect(tactical.slots[0].aimStartTimes.has(ship.id)).toBe(false);
            // Aim on anything else is kept.
            expect(tactical.slots[0].aimStartTimes.has(other.id)).toBe(true);
            runShip(100);

            // Nobody else is affected.
            expect(bystander.tacticalState.lockLevel).toBe(0);
        });

        it('leaves a Lock on some other ship alone', () => {
            const { other, addRaider, playOn } = createRelativeWorld();
            const raider = addRaider(8, 0);
            const tactical = raider.tacticalState;

            expect(tactical.addLock(other, 2)).toBe(true);
            expect(playOn('breakAway', raider).played).toBe(true);
            expect(tactical.lockLevel).toBe(2);
            expect(tactical.lockTargetId).toBe(other.id);
        });
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
    /** A ship as `createShip` makes, with some cards in tactical's hand, deck and weapon slot, to see what they cost. */
    function createRunningShip() {
        const world = createShip();
        const { ship } = world;
        const tactical = ship.tacticalState;

        const inHand = new CardState(ship.getCardId(), 'flare');
        const inDeck = new CardState(ship.getCardId(), 'flare');
        const inSlot = new CardState(ship.getCardId(), 'flare');
        tactical.addCardToHand(inHand);
        tactical.deck.push(inDeck);
        tactical.slots[0].card = inSlot;

        const costs = () => [inHand, inDeck, inSlot].map(card => card.getParameter('cost'));
        return { ...world, tactical, costs };
    }

    it('flies a fast straight pass, and makes tactical\'s cards cost 1 less for as long as it lasts', () => {
        const { state, ship, helm, tactical, play, costs, runUntilManeuverEnds, maneuverDuration } = createRunningShip();
        expect(cardDefinitions.attackRun).toMatchObject({ targetType: 'location', system: 'helm', rarity: 'uncommon', baseSpeed: 1.5, minDistance: 4, parameters: { cost: 3, evasion: 15, costReduction: 1 } });
        expect(getCardDefinition('attackRun').synergy).toBeUndefined();
        expect(costs()).toEqual([2, 2, 2]);

        const { card, played } = play('attackRun', '9,0');
        expect(played).toBe(true);
        expect(helm.activeManeuver!.card).toBe(card);
        expect(maneuverDuration()).toBeCloseTo(6000);
        expect(helm.evasion).toBe(15);
        expect(costs()).toEqual([1, 1, 1]);
        expect(tactical.hasEffect('attackRun')).toBe(true);

        state.tick(5000);
        expect(costs()).toEqual([1, 1, 1]);

        runUntilManeuverEnds();
        expect(costs()).toEqual([2, 2, 2]);
        expect(tactical.hasEffect('attackRun')).toBe(false);
        expect(ship.getPosition(state.currentTime).x).toBeCloseTo(9);
        expect(helm.deck.includes(card)).toBe(true);
    });

    it('stops discounting the moment it is called off', () => {
        const { state, helm, tactical, play, costs } = createRunningShip();

        play('attackRun', '9,0');
        state.tick(1000);
        helm.cancelActiveManeuver();
        state.tick(100);

        expect(helm.activeManeuver).toBeNull();
        expect(tactical.hasEffect('attackRun')).toBe(false);
        expect(costs()).toEqual([2, 2, 2]);
    });

    it('stops discounting when another maneuver replaces it, without the discounts piling up', () => {
        const { state, helm, play, costs } = createRunningShip();

        play('attackRun', '9,0');
        state.tick(1000);
        expect(play('attackRun', '14,0').played).toBe(true);
        expect(costs()).toEqual([1, 1, 1]);

        expect(play('burn', '20,0').played).toBe(true);
        expect(costs()).toEqual([2, 2, 2]);
        expect(helm.activeManeuver).not.toBeNull();
    });

    it('does nothing if it cannot be played', () => {
        const { tactical, play, costs } = createRunningShip();

        // Too close.
        expect(play('attackRun', '2,0').played).toBe(false);
        expect(tactical.hasEffect('attackRun')).toBe(false);
        expect(costs()).toEqual([2, 2, 2]);
    });

    it('does not discount helm\'s own cards, and is left alone by the AI', () => {
        const { helm, play } = createRunningShip();
        const burn = new CardState(1000, 'burn');
        helm.addCardToHand(burn);

        play('attackRun', '9,0');
        expect(burn.getParameter('cost')).toBe(2);
        expect(getCardEvaluator('attackRun')).toBeUndefined();
    });
});

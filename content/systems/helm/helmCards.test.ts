import { calculateMotionPath } from 'common-data/features/cards/utils/calculateMotionPath';
import { cardDefinitions, type CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { evasivePatternDuration, calculatePatternPath } from 'common-data/features/cards/utils/evasivePatterns';
import { getCardRarity } from 'common-data/features/cards/utils/getCardRarity';
import { getShopCardTypes } from 'common-data/features/cards/utils/getShopCardTypes';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { clampAngle, determineAngle } from 'common-data/features/space/utils/vectors';
import { engageTractorBeam } from 'content/systems/tactical/effects/tacticalEffects.engine';
import { getCardEvaluator } from 'engine/ai/evaluators';
import { getCardDefinition } from 'engine/cards/getEngineCardDefinition';
import { AiShip } from 'engine/state/AiShip';
import { CardState } from 'engine/state/CardState';
import { MotionKeyframe } from 'engine/state/MotionKeyframe';
import { PlayerShip } from 'engine/state/PlayerShip';
import { momentumDecayInterval as engineMomentumDecayInterval } from 'engine/state/systems/HelmState';
import { setupGameRoom, shipSetup } from 'engine/testUtils';
import { describe, expect, it, vi } from 'vitest';
import { momentumDecayInterval } from './effects/helmEffects.shared';
import type { WeaponEffect } from 'common-data/features/space/types/WeaponEffect';
import type { EngineWeaponSlotCardDefinition } from 'engine/cards/EngineCardDefinition';
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
        // The card's own 10, and 3 for each of the 2 levels of Momentum it gave.
        expect(helm.evasion).toBe(16);

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
        // The card's 10 and 8 for each of the 4 levels it had, and 3 for each of the 2 it's left with.
        expect(helm.evasion).toBe(10 + 4 * 8 + 2 * 3);
        expect(accuracy(other, ship)).toBe(100 - 48);
        expect(momentum()).toBe(2);

        // The card goes back to what it was once it has been flown, leaving only what Momentum adds.
        runUntilManeuverEnds();
        expect(card.getParameter('evasion')).toBe(10);
        expect(helm.evasion).toBe(2 * 3);
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

describe('Momentum', () => {
    it('is described with the same decay time as the engine uses', () => {
        expect(momentumDecayInterval).toBe(engineMomentumDecayInterval);
    });
});

describe('Drift', () => {
    it('is an uncommon helm card that wants Momentum', () => {
        expect(cardDefinitions.drift).toMatchObject({
            targetType: 'location',
            system: 'helm',
            rarity: 'uncommon',
            parameters: { cost: 2, distancePerMomentum: 1.5, evasionPerMomentum: 8 },
        });
        expect(getCardDefinition('drift').synergy).toEqual({ wants: ['momentum'] });
    });

    it('cannot be played with no Momentum, or while the ship is not moving', () => {
        const { helm, play, momentum } = createShip();

        // Still, with Momentum.
        helm.adjustEffectLevel('momentum', 3);
        expect(play('drift', '5,3').played).toBe(false);
        expect(momentum()).toBe(3);
        expect(helm.activeManeuver).toBeNull();

        // Moving, with none.
        helm.removeEffect('momentum', 'early');
        play('slowAndSteady', '8,0');
        expect(momentum()).toBe(0);
        expect(play('drift', '5,3').played).toBe(false);
        expect(helm.activeManeuver!.card.type).toBe('slowAndSteady');
    });

    it('slides on the way the ship was going for 1.5 units per level, stopping there facing the point, and spends all the Momentum', () => {
        const { state, ship, helm, play, run, runUntilManeuverEnds, momentum } = createShip();

        // Flying along +x, with 4 levels (the second one starts it, so it gives none of its own).
        play('burn', '20,0');
        helm.adjustEffectLevel('momentum', 2);
        expect(momentum()).toBe(4);
        run(2000);
        const before = ship.getPosition(state.currentTime);
        expect(before.x).toBeGreaterThan(1);

        // Facing the point at the ship's side, which it passes by while sliding.
        const { card, played } = play('drift', `${before.x + 6},-4`);
        expect(played).toBe(true);
        expect(helm.activeManeuver!.card).toBe(card);
        expect(momentum()).toBe(0);
        expect(helm.maneuverSpeedMultiplier).toBe(1);

        runUntilManeuverEnds();
        const after = ship.getPosition(state.currentTime);
        expect(after.x).toBeCloseTo(before.x + 4 * 1.5, 1);
        expect(after.y).toBeCloseTo(0, 1);
        // It faces the point from where it stopped: ahead and to the right.
        expect(after.angle).toBeCloseTo(determineAngle(after, { x: before.x + 6, y: -4 }));
        expect(card.getParameter('evasion')).toBe(0);
    });

    it('slows steadily to a stop, never going backwards', () => {
        const { state, ship, helm, play, run } = createShip();

        play('burn', '20,0');
        helm.adjustEffectLevel('momentum', 1);
        run(2000);
        play('drift', '30,0');

        let lastX = ship.getPosition(state.currentTime).x;
        let lastStep = Infinity;
        while (helm.activeManeuver) {
            state.tick(100);
            const x = ship.getPosition(state.currentTime).x;
            expect(x).toBeGreaterThanOrEqual(lastX - 1e-9);
            // Each step covers no more ground than the one before.
            expect(x - lastX).toBeLessThanOrEqual(lastStep + 0.05);
            lastStep = x - lastX;
            lastX = x;
        }
    });

    it('makes the ship harder to hit for each level of Momentum spent, for as long as it drifts', () => {
        const { state, ship, other, helm, play, run, accuracy, runUntilManeuverEnds } = createShip();

        play('burn', '20,0');
        helm.adjustEffectLevel('momentum', 1);
        run(2000);
        const { card } = play('drift', '30,0');

        // 3 levels spent, at 8 each, and no Momentum is left to add to it.
        expect(card.getParameter('evasion')).toBe(3 * 8);
        expect(helm.evasion).toBe(3 * 8);
        expect(accuracy(other, ship)).toBe(100 - 24);

        runUntilManeuverEnds();
        expect(state.currentTime).toBeGreaterThan(0);
        expect(card.getParameter('evasion')).toBe(0);
        expect(helm.evasion).toBe(0);
    });
});

describe('Evasive Maneuvers', () => {
    const patterns = ['patternAlpha', 'patternBeta', 'patternGamma'] as const;

    /** Where each pattern ends, relative to where the ship started and which way it faced: forward, to the right, and the angle it turns clockwise (to the right) by. */
    const expectedEnds = {
        patternAlpha: { forward: 4, right: 0, turn: 0 },
        patternBeta: { forward: 1.5, right: 3, turn: Math.PI / 2 },
        patternGamma: { forward: 0, right: -2, turn: -Math.PI },
    } as const;

    /** How far two angles are apart, going the shortest way round. */
    const angleBetween = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

    it('is a common choice of three patterns, each of which is as hard to hit as the card, and none of which is sold alone', () => {
        expect(cardDefinitions.evasiveManeuvers).toMatchObject({ targetType: 'choice', system: 'helm', cards: [...patterns], parameters: { cost: 2, evasion: 40 } });
        expect(getCardRarity('evasiveManeuvers')).toBe('common');
        expect(getShopCardTypes('helm')).toContain('evasiveManeuvers');

        for (const pattern of patterns) {
            expect(cardDefinitions[pattern]).toMatchObject({ targetType: 'no-target', system: 'helm', parameters: { cost: 2, evasion: 40, accuracyLoss: 25, duration: 5 } });
            expect(getShopCardTypes('helm')).not.toContain(pattern);
            expect(getCardDefinition(pattern)).not.toHaveProperty('aiEvaluator');
        }
        expect(getCardDefinition('evasiveManeuvers')).not.toHaveProperty('aiEvaluator');
        expect(getCardDefinition('evasiveManeuvers')).not.toHaveProperty('synergy');
    });

    for (const pattern of patterns) {
        it(`${pattern} flies for 5 seconds, ending where and facing as described, hard to hit but with less accurate weapons`, () => {
            const { state, ship, other, helm, play, run, effectLevel, accuracy } = createShip();
            const expected = expectedEnds[pattern];

            const { card, played } = play('evasiveManeuvers', undefined, pattern);
            expect(played).toBe(true);
            expect(helm.activeManeuver!.card).toBe(card);
            expect(card.type).toBe('evasiveManeuvers');
            expect(helm.hand.includes(card)).toBe(false);
            expect(helm.deck.includes(card)).toBe(false);
            expect(helm.activeManeuver!.endTime - helm.activeManeuver!.startTime).toBe(evasivePatternDuration);
            expect(helm.evasion).toBe(40);
            expect(effectLevel('helm', 'jinking')).toBe(25);
            expect(accuracy(other, ship)).toBe(60);
            expect(accuracy(ship, other)).toBe(75);

            // It flies smoothly, without jumping or spinning from one moment to the next, the whole way.
            let previous = ship.getPosition(state.currentTime);
            for (let t = 0; t < 4900; t += 100) {
                state.tick(100);
                const position = ship.getPosition(state.currentTime);
                expect(Math.hypot(position.x - previous.x, position.y - previous.y)).toBeLessThan(0.4);
                expect(angleBetween(position.angle, previous.angle)).toBeLessThan(1);
                previous = position;
            }
            expect(helm.activeManeuver).not.toBeNull();
            expect(effectLevel('helm', 'jinking')).toBe(25);

            // Then it ends, with the card back in the deck.
            run(200);
            expect(helm.activeManeuver).toBeNull();
            const end = ship.getPosition(state.currentTime);
            expect(end.x).toBeCloseTo(expected.forward, 1);
            expect(end.y).toBeCloseTo(expected.right, 1);

            // Positive angles turn left, as ships' angles do on the map.
            expect(angleBetween(end.angle, -expected.turn)).toBeLessThan(0.05);
            expect(helm.deck.filter(candidate => candidate === card)).toHaveLength(1);
            expect(effectLevel('helm', 'jinking')).toBe(0);
            expect(helm.evasion).toBe(0);
            expect(accuracy(other, ship)).toBe(100);
            expect(accuracy(ship, other)).toBe(100);
        });
    }

    it('has patterns that are different from each other, and turn the way they should', () => {
        const start = { x: 0, y: 0, angle: 0 };
        const alpha = calculatePatternPath('patternAlpha', start);
        const beta = calculatePatternPath('patternBeta', start);
        const gamma = calculatePatternPath('patternGamma', start);

        // Alpha swerves to both sides, without going back on itself.
        expect(Math.max(...alpha.map(point => point.y))).toBeGreaterThan(0.8);
        expect(Math.min(...alpha.map(point => point.y))).toBeLessThan(-0.8);
        expect(Math.min(...alpha.map(point => point.x))).toBeGreaterThan(-0.01);

        // Beta only goes to the right, and turns through every heading between ahead and right, which is the other way round to Gamma.
        expect(Math.min(...beta.map(point => point.y))).toBeGreaterThan(-0.01);
        expect(Math.min(...beta.map(point => point.angle))).toBeCloseTo(-Math.PI / 2 - 0.1, 0);
        expect(Math.max(...beta.map(point => point.angle))).toBeLessThan(0.01);

        // Gamma only goes to the left (y increases to the right of a ship facing along x), and turns left all of the way, to face back.
        expect(Math.max(...gamma.map(point => point.y))).toBeLessThan(0.01);
        expect(gamma[gamma.length - 1].angle).toBeCloseTo(Math.PI);
        for (let index = 1; index < gamma.length; index++) {
            expect(gamma[index].angle).toBeGreaterThanOrEqual(gamma[index - 1].angle - 1e-9);
        }
    });

    it('flies relative to where the ship is and which way it faces', () => {
        const { state, ship, helm, play, runUntilManeuverEnds } = createShip();

        // Facing up the map, which is to the left of facing along the x axis.
        ship.setMotion(new MotionKeyframe(state.currentTime, 5, 5, Math.PI / 2));
        expect(play('evasiveManeuvers', undefined, 'patternBeta').played).toBe(true);
        runUntilManeuverEnds();

        // Right of up the map is along x, and ahead is up. Beta ends 1.5 ahead and 3 to the right, facing right.
        const end = ship.getPosition(state.currentTime);
        expect(end.x).toBeCloseTo(5 + 3, 1);
        expect(end.y).toBeCloseTo(5 - 1.5, 1);
        expect(angleBetween(end.angle, 0)).toBeLessThan(0.05);
        expect(helm.activeManeuver).toBeNull();
    });

    it('keeps Momentum, as the ship never stops moving', () => {
        const { helm, play, run, momentum, runUntilManeuverEnds } = createShip();

        play('burn', '6,0');
        runUntilManeuverEnds();
        expect(play('evasiveManeuvers', undefined, 'patternAlpha').played).toBe(true);
        expect(momentum()).toBe(3);

        run(4500);
        expect(helm.activeManeuver).not.toBeNull();
        expect(momentum()).toBe(3);
    });

    it('stops throwing the weapons off as soon as it is called off', () => {
        const { state, ship, other, helm, play, run, effectLevel, accuracy } = createShip();

        play('evasiveManeuvers', undefined, 'patternGamma');
        run(1000);
        expect(accuracy(ship, other)).toBe(75);
        helm.cancelActiveManeuver();
        state.tick(100);

        expect(helm.activeManeuver).toBeNull();
        expect(effectLevel('helm', 'jinking')).toBe(0);
        expect(accuracy(ship, other)).toBe(100);
    });
});

/** The keyframes of the ship's current motion, as positions with the time they're reached after the start, for judging the shape of a path. */
function motionPath(ship: PlayerShip) {
    const start = ship.motion[0].time;
    return ship.motion.map(keyframe => ({ time: keyframe.time - start, x: keyframe.x, y: keyframe.y, angle: keyframe.angle }));
}

/** How many times a path crosses the straight line from the ship at the origin to a target on the x axis. */
function crossings(path: { y: number }[]) {
    let count = 0;
    let side = 0;
    for (const { y } of path) {
        if (Math.abs(y) > 0.2 && Math.sign(y) !== side) {
            count += side === 0 ? 0 : 1;
            side = Math.sign(y);
        }
    }
    return count;
}

describe('Zig-Zag', () => {
    /** Plays Zig-Zag from the origin to a target on the x axis, and says what its path was like. */
    function fly(distance: number) {
        const { ship, helm, play } = createShip();
        expect(play('zigZag', `${distance},0`).played).toBe(true);
        const path = motionPath(ship);
        return { path, helm, crossings: crossings(path), width: Math.max(...path.map(({ y }) => Math.abs(y))) };
    }

    it('weaves to the target, facing it all the way', () => {
        const { path, helm, width } = fly(6);
        expect(cardDefinitions.zigZag).toMatchObject({ targetType: 'location', minDistance: 3, parameters: { cost: 2, evasion: 25 } });
        expect(helm.evasion).toBe(25);

        expect(width).toBeGreaterThan(0.3);
        for (const keyframe of path) {
            expect(keyframe.angle).toBeCloseTo(0);
        }

        // It starts and ends on the line.
        const end = path[path.length - 1];
        expect(end.x).toBeCloseTo(6);
        expect(end.y).toBeCloseTo(0);
    });

    it('has more legs, but no wider a path, the further it goes', () => {
        const near = fly(4);
        const middling = fly(8);
        const far = fly(16);

        expect(near.crossings).toBeGreaterThanOrEqual(1);
        expect(middling.crossings).toBeGreaterThan(near.crossings);
        expect(far.crossings).toBeGreaterThan(middling.crossings);
        expect(far.crossings).toBeGreaterThanOrEqual(middling.crossings * 1.5);

        expect(middling.width).toBeCloseTo(near.width, 1);
        expect(far.width).toBeCloseTo(near.width, 1);
    });

    it('gains legs one at a time as the distance grows', () => {
        let previous = 0;
        for (let distance = 3; distance <= 14; distance += 0.5) {
            const { crossings: count } = fly(distance);
            expect(count).toBeGreaterThanOrEqual(previous);
            expect(count - previous).toBeLessThanOrEqual(1);
            previous = count;
        }
    });

    it('cannot be played too close', () => {
        const { play } = createShip();
        expect(play('zigZag', '2,0').played).toBe(false);
    });
});

describe('Feint', () => {
    /** Plays Feint from the origin, with the ship facing the given angle, to a target 9 units away on the x axis. */
    function fly(angle: number) {
        const { state, ship, helm, play } = createShip();
        ship.setMotion(new MotionKeyframe(state.currentTime, 0, 0, angle));
        expect(play('feint', '9,0').played).toBe(true);
        return { path: motionPath(ship), helm };
    }

    /** The furthest from the line to the target that the path gets: where it turns back. */
    const furthestOut = (path: { x: number; y: number }[]) => path.reduce((furthest, keyframe) => Math.abs(keyframe.y) > Math.abs(furthest.y) ? keyframe : furthest);

    it('sets off at an angle for a third of the way, then cuts back to the target, facing the way it goes', () => {
        const { path, helm } = fly(0);
        expect(cardDefinitions.feint).toMatchObject({ targetType: 'location', system: 'helm', minDistance: 4, parameters: { cost: 2, evasion: 30 } });
        expect(helm.evasion).toBe(30);

        // The way out is a third of the way, at 55 degrees to the line.
        const turn = furthestOut(path);
        expect(Math.hypot(turn.x, turn.y)).toBeCloseTo(3, 0);
        expect(Math.abs(turn.y) / Math.hypot(turn.x, turn.y)).toBeCloseTo(Math.sin(55 * Math.PI / 180), 1);

        const end = path[path.length - 1];
        expect(end.x).toBeCloseTo(9);
        expect(end.y).toBeCloseTo(0);
        expect(end.angle).toBeCloseTo(determineAngle(turn, end), 1);
    });

    it('sets off to the left when the target is dead ahead', () => {
        // The left is up the screen, so negative y.
        expect(furthestOut(fly(0).path).y).toBeLessThan(-2);
    });

    it('sets off to whichever side needs less turn from the current heading', () => {
        // Facing a little left (a positive angle), the left is closer. Facing a little right, it's the right.
        expect(furthestOut(fly(0.3).path).y).toBeLessThan(-2);
        expect(furthestOut(fly(-0.3).path).y).toBeGreaterThan(2);
    });

    it('cannot be played too close', () => {
        const { play } = createShip();
        expect(play('feint', '3,0').played).toBe(false);
    });
});

describe('Broadside', () => {
    /** A ship as `createShip` makes, facing the given angle, and a raider hostile to it at the given location if there is one. */
    function createBroadsideShip(angle = 0, raiderAt?: [number, number]) {
        rooms.createState().initFactions([
            { id: 'player' },
            { id: 'raiders', relations: { player: RelationshipType.Hostile } },
        ], 'player');
        const world = createShip();
        const { state, ship } = world;
        ship.setMotion(new MotionKeyframe(state.currentTime, 0, 0, angle));

        if (raiderAt) {
            state.add(new AiShip(state, { ...shipSetup('raiders', raiderAt[0], raiderAt[1]), goal: { type: 'search-and-destroy' }, skill: 1 }));
        }

        const startTime = state.currentTime;
        const angleAt = (fraction: number) => clampAngle(ship.getPosition(startTime + world.maneuverDuration() * fraction).angle);

        /** Flies the player's ship alone, so that no raider's AI moves it, until its maneuver is over. */
        const fly = () => {
            while (world.helm.activeManeuver) {
                state.currentTime += 100;
                ship.tick(100, state.currentTime);
            }
        };

        return { ...world, angleAt, fly };
    }

    it('moves briskly to the target, in a straight line', () => {
        const { ship, helm, play, maneuverDuration } = createBroadsideShip(0, [3, -8]);
        expect(cardDefinitions.broadside).toMatchObject({ targetType: 'location', system: 'helm', baseSpeed: 1, parameters: { cost: 1, evasion: 0 } });

        const { card, played } = play('broadside', '6,0');
        expect(played).toBe(true);
        expect(helm.activeManeuver!.card).toBe(card);
        expect(maneuverDuration()).toBeCloseTo(6000);
        expect(helm.evasion).toBe(0);

        for (const keyframe of motionPath(ship)) {
            expect(keyframe.y).toBeCloseTo(0);
        }
    });

    it('turns side-on towards the hostile ship on its left, half way along, and straightens up again by the end', () => {
        const { state, ship, play, angleAt, fly } = createBroadsideShip(0, [3, -8]);

        expect(play('broadside', '6,0').played).toBe(true);
        expect(angleAt(0)).toBeCloseTo(0);
        expect(angleAt(0.25)).toBeGreaterThan(0.3);
        expect(angleAt(0.25)).toBeLessThan(Math.PI / 2 - 0.3);
        expect(angleAt(0.5)).toBeCloseTo(Math.PI / 2);
        expect(angleAt(0.75)).toBeGreaterThan(0.3);
        expect(angleAt(0.75)).toBeLessThan(Math.PI / 2 - 0.3);

        fly();
        const end = ship.getPosition(state.currentTime);
        expect(end.x).toBeCloseTo(6);
        expect(end.y).toBeCloseTo(0);
        expect(end.angle).toBeCloseTo(0);
    });

    it('turns the other way for a hostile ship on its right', () => {
        const { play, angleAt } = createBroadsideShip(0, [3, 8]);

        expect(play('broadside', '6,0').played).toBe(true);
        expect(angleAt(0.5)).toBeCloseTo(-Math.PI / 2);
    });

    it('goes by which side of its direction of travel the hostile ship is on, not which side of the map', () => {
        // Travelling back along the x axis, a raider that was to the left (up the screen) is now to the right, so it faces up the screen too.
        const { play, angleAt } = createBroadsideShip(Math.PI, [-3, -8]);

        expect(play('broadside', '-6,0').played).toBe(true);
        expect(angleAt(0.5)).toBeCloseTo(Math.PI / 2);
    });

    it('with no hostile ship, turns whichever way is less far from its heading', () => {
        const left = createBroadsideShip(0.3);
        expect(left.play('broadside', '6,0').played).toBe(true);
        expect(left.angleAt(0.5)).toBeCloseTo(Math.PI / 2);

        const right = createBroadsideShip(-0.3);
        expect(right.play('broadside', '6,0').played).toBe(true);
        expect(right.angleAt(0.5)).toBeCloseTo(-Math.PI / 2);

        // Dead ahead, it's the left.
        const ahead = createBroadsideShip(0);
        expect(ahead.play('broadside', '6,0').played).toBe(true);
        expect(ahead.angleAt(0.5)).toBeCloseTo(Math.PI / 2);
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
        // Its own 30, and 3 for each level of Momentum.
        expect(momentum()).toBe(2);
        expect(helm.evasion).toBe(30 + 2 * 3);

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

    /** Plays the given option from the origin, facing along the x axis, to a target 6 units away, and says how the heading changes along the way. */
    function fly(option: 'sweepLeft' | 'sweepRight') {
        // The first keyframe is the start, and the second the turn to the heading it sets off at.
        const path = calculateMotionPath({ x: 0, y: 0, angle: 0 }, cardDefinitions[option], { x: 6, y: 0 })!.slice(1);
        const lengths = path.map((keyframe, index) => index === 0 ? 0 : Math.hypot(keyframe.x - path[index - 1].x, keyframe.y - path[index - 1].y));
        const travelled = lengths.map((_, index) => lengths.slice(0, index + 1).reduce((sum, length) => sum + length, 0));
        const total = travelled[travelled.length - 1];
        const first = path[0].angle;
        const last = path[path.length - 1].angle;

        return { path, travelled, total, first, last };
    }

    it('curves out to one side, and turns the way its name says', () => {
        const left = fly('sweepLeft');
        const right = fly('sweepRight');

        // A left sweep turns anticlockwise (an increasing angle), bulging out to the right of the line (positive y).
        expect(left.last).toBeGreaterThan(left.first + 1);
        expect(Math.max(...left.path.map(keyframe => keyframe.y))).toBeGreaterThan(1);
        expect(Math.min(...left.path.map(keyframe => keyframe.y))).toBeGreaterThan(-0.05);

        expect(right.last).toBeLessThan(right.first - 1);
        expect(Math.min(...right.path.map(keyframe => keyframe.y))).toBeLessThan(-1);
        expect(Math.max(...right.path.map(keyframe => keyframe.y))).toBeLessThan(0.05);
    });

    it('does most of its turning early, and ends with a short straight leg', () => {
        for (const option of ['sweepLeft', 'sweepRight'] as const) {
            const { path, travelled, total, first, last } = fly(option);

            // By 40% of the way along, it has turned through most of what it will.
            const index = travelled.findIndex(distance => distance >= total * 0.4);
            expect(Math.abs(path[index].angle - first)).toBeGreaterThan(Math.abs(last - first) * 0.7);

            // The final leg is where it has stopped turning.
            const straightFrom = path.findIndex(keyframe => Math.abs(keyframe.angle - last) < 0.002);
            expect(total - travelled[straightFrom]).toBeLessThan(total * 0.25);
            expect(total - travelled[straightFrom]).toBeGreaterThan(0);

            // It arrives on the target.
            expect(path[path.length - 1].x).toBeCloseTo(6);
            expect(path[path.length - 1].y).toBeCloseTo(0);
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

    it('loses Momentum a level at a time, as the ship is still', () => {
        const { play, playOn, addRaider, run, momentum, runUntilManeuverEnds } = createLockingShip();
        // Straight ahead of the ship, so that it has no turning to do.
        const raider = addRaider(20, 0);

        play('burn', '6,0');
        runUntilManeuverEnds();
        playOn(raider);
        expect(momentum()).toBe(3);

        run(1600);
        expect(momentum()).toBe(2);

        run(3000);
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

describe('Interpose blocking shots', () => {
    /** A raider at (4, 6) is shooting at a friendly ship at (4, 0), which the player's ship has just started interposing for, so it sits at (4, 3) in the line of fire. */
    function createScreen() {
        const world = createRelativeWorld();
        const { state, ship, other, place, addRaider, playOn, runShip } = world;
        place(other, 4, 0);
        const raider = addRaider(4, 6);
        playOn('interpose', other);
        runShip(4000);

        const effects: WeaponEffect[] = [];
        vi.spyOn(state, 'broadcastWeaponEffect').mockImplementation((effect) => {
            effects.push(effect);
        });
        // Only where the damage goes matters here, so neither ship takes any, and so neither is destroyed by a few shots.
        const shipDamage = vi.spyOn(ship, 'damage').mockReturnValue(0);
        const otherDamage = vi.spyOn(other, 'damage').mockReturnValue(0);
        const fire = (shooter: AiShip, at: PlayerShip | AiShip) => {
            const card = getCardDefinition('phaserCannon') as EngineWeaponSlotCardDefinition;
            card.fire(state, shooter, at, { cost: 0, damage: 5 }, 100, [], null);
        };

        return { ...world, raider, effects, shipDamage, otherDamage, fire };
    }

    it('has the interposing ship take a shot at the ship it is protecting, when it is in the way', () => {
        const { ship, other, raider, effects, shipDamage, otherDamage, fire } = createScreen();
        expect(other.getSystem('helm').hasEffect('screened')).toBe(true);

        fire(raider, other);

        expect(otherDamage).not.toHaveBeenCalled();
        expect(shipDamage).toHaveBeenCalledOnce();
        expect(effects[0]).toMatchObject({ type: 'shot', targetId: ship.id, intercepted: true });
        expect(effects.find(effect => effect.type === 'impact')).toMatchObject({ targetId: ship.id, intercepted: true });
    });

    it('leaves a shot at the interposing ship itself alone', () => {
        const { ship, raider, shipDamage, fire, effects } = createScreen();

        fire(raider, ship);
        expect(shipDamage).toHaveBeenCalledOnce();
        expect(effects[0]).toMatchObject({ targetId: ship.id, intercepted: undefined });
    });

    it('lets a shot through when the interposing ship is not on the line of fire', () => {
        const { other, raider, place, shipDamage, otherDamage, fire } = createScreen();

        // The raider moves round to the side, so the line to the friendly ship no longer passes the interposing ship.
        place(raider, 12, 0);
        fire(raider, other);
        expect(shipDamage).not.toHaveBeenCalled();
        expect(otherDamage).toHaveBeenCalledOnce();

        // Nor does it block a shot from behind the friendly ship, where it's not between the two.
        otherDamage.mockClear();
        place(raider, 4, -6);
        fire(raider, other);
        expect(shipDamage).not.toHaveBeenCalled();
        expect(otherDamage).toHaveBeenCalledOnce();

        // Or one from a raider closer than the interposing ship is.
        otherDamage.mockClear();
        place(raider, 4, 1);
        fire(raider, other);
        expect(shipDamage).not.toHaveBeenCalled();
        expect(otherDamage).toHaveBeenCalledOnce();
    });

    it('stops blocking once the maneuver ends, or is called off', () => {
        const { other, helm, raider, runShip, shipDamage, otherDamage, fire } = createScreen();

        helm.cancelActiveManeuver();
        runShip(100);
        expect(other.getSystem('helm').hasEffect('screened')).toBe(false);
        fire(raider, other);
        expect(shipDamage).not.toHaveBeenCalled();
        expect(otherDamage).toHaveBeenCalledOnce();
    });

    it('stops blocking once the interposing ship is gone', () => {
        const { state, ship, other, raider, shipDamage, otherDamage, fire } = createScreen();

        state.remove(ship);
        fire(raider, other);
        expect(shipDamage).not.toHaveBeenCalled();
        expect(otherDamage).toHaveBeenCalledOnce();
    });

    it('does nothing for a ship that is not the one being protected', () => {
        const { state, ship, other, raider, place, shipDamage, fire } = createScreen();

        // A third ship that the interposer is not screening, shot at from the same direction.
        const { appearance: _a, faction: _f, ...thirdSetup } = shipSetup(undefined, 4, -3);
        const third = new PlayerShip(state, thirdSetup);
        state.add(third);
        third.startEncounter();
        place(third, 4, -3);
        place(other, 4, 20);
        place(raider, 4, 6);
        const thirdDamage = vi.spyOn(third, 'damage').mockReturnValue(0);

        fire(raider, third);
        expect(shipDamage).not.toHaveBeenCalled();
        expect(thirdDamage).toHaveBeenCalledOnce();
        expect(ship.getSystem('helm').hasEffect('screened')).toBe(false);
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
        expect(helm.evasion).toBe(20 + 3);
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

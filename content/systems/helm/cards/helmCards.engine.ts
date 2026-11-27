import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { calculateDriftPath } from 'common-data/features/cards/utils/calculateDriftPath';
import { calculatePatternPath, evasivePatternDuration, type EvasivePatternType } from 'common-data/features/cards/utils/evasivePatterns';
import { calculateHairpinPath, calculateJukePath, getSideAwayFrom, hairpinSpeed, jukeDuration } from 'common-data/features/cards/utils/momentumManeuvers';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { clampAngle, determineAngle, distanceSq } from 'common-data/features/space/utils/vectors';
import { screenShip, unscreenShip } from 'content/systems/helm/effects/helmEffects.engine';
import { choiceEvaluator } from 'engine/ai/evaluators';
import { locationCardEvaluator } from 'engine/ai/evaluators/helm';
import { applyMotionCard } from 'engine/cards/applyMotionCard';
import { LocationTargetCardFunctionality, NoTargetCardFunctionality } from 'engine/cards/EngineCardDefinition';
import { defineEngineCards } from 'engine/content/EngineContent';
import { CardCooldownState } from 'engine/state/CardCooldownState';
import { CardState } from 'engine/state/CardState';
import { GameObject } from 'engine/state/GameObject';
import { GameState } from 'engine/state/GameState';
import { MotionKeyframe } from 'engine/state/MotionKeyframe';
import { SensorGhost } from 'engine/state/SensorGhost';
import { Ship } from 'engine/state/Ship';
import { cards as sharedCards } from './helmCards.shared';

/** How far ahead a locked-on ship plans its turning each time, in milliseconds per keyframe, and how many keyframes ahead it plans. It plans again after each step. */
const lockOnStepDuration = 250;
const lockOnStepsAhead = 3;

/** How fast a locked-on ship turns, in radians per millisecond: 180 degrees in 4 seconds, as fast as Pivot turns. */
const lockOnTurnRate = Math.PI / 4000;

/** How fast a ship can move to keep its station relative to another ship, in units per second: as fast as Burn flies. */
const stationMaxSpeed = 1.5;

/**
 * How fast a pirouetting ship flies, in units per second, and turns, in radians per millisecond (fast enough to keep facing its target as it goes round it),
 * how close to the circle round its target it has to get before it starts round, in units, and how long it holds still on the far side, in milliseconds.
 */
const pirouetteSpeed = 2.5;
const pirouetteTurnRate = Math.PI / 1000;
const pirouetteTolerance = 0.3;
const pirouetteHoldTime = 500;

/** How close to the point alongside its target an attack run has to get before it goes on round behind it, in units. */
const attackRunPassTolerance = 0.75;

/** How fast an orbiting ship goes round, in units per second, and the smallest circle it will fly. */
const orbitSpeed = 1;
const orbitMinRadius = 1.5;

/** How far from the ship it's protecting an interposing ship sits, at most, in units. */
const interposeDistance = 3;

/** How far behind its target a shadowing ship stays, in units. */
const shadowDistance = 2.5;

/** How far ahead of now to look, in milliseconds, to tell which way a ship is going and how fast. */
const driftSampleTime = 250;

/** How many levels of Momentum the ship's helm holds. */
function getMomentum(ship: Ship): number {
    return ship.helmState.getEffects().find(effect => effect.type === 'momentum')?.level ?? 0;
}

/**
 * Spend up to the given levels of the ship's Momentum, drawing a card for the helm if any were spent. Every card that spends Momentum does so this way,
 * so that a burst of maneuvers that built it up and then cashed it in leaves the helm with a card to carry on with.
 */
function spendMomentum(ship: Ship, levels: number) {
    const spent = Math.min(levels, getMomentum(ship));
    if (spent <= 0) {
        return;
    }

    ship.helmState.adjustEffectLevel('momentum', -spent);
    ship.helmState.drawFromTop(1);
}

/** A maneuver that also adds as many levels of Momentum as its `momentum` parameter says. */
const playMomentumBuilder: LocationTargetCardFunctionality['play'] = (gameState, ship, cardInstance, cardDefinition, location, parameters) => {
    if (!applyMotionCard(gameState, ship, cardInstance, cardDefinition, location, parameters)) {
        return false;
    }

    ship.helmState.adjustEffectLevel('momentum', parameters['momentum']);
    return true;
};

/**
 * What playing one of the evasive maneuver patterns does: the ship flies the pattern's path from where it is and which way it faces, so it's the same each time.
 * The evasion comes from the card being flown, and the ship's own weapons are less accurate until the pattern ends, even if that's early.
 */
function playEvasivePattern(pattern: EvasivePatternType): NoTargetCardFunctionality['play'] {
    return (gameState, ship, parameters, card) => {
        const startTime = gameState.currentTime;
        const keyframes = calculatePatternPath(pattern, ship.getPosition(startTime));

        ship.setMotion(...keyframes.map(({ time, x, y, angle }) => new MotionKeyframe(startTime + time, x, y, angle)));
        ship.helmState.setActiveManeuver(new CardCooldownState(card, startTime, startTime + evasivePatternDuration, parameters['cost']));

        const helm = ship.helmState;
        helm.removeEffect('jinking', 'expired');
        helm.adjustEffectLevel('jinking', parameters['accuracyLoss']);
        helm.whenActiveManeuverEnds(() => helm.removeEffect('jinking', 'expired'));
        return true;
    };
}

/** The ship hostile to the given one that is closest to where it is, at the given time, if there are any. A sensor ghost counts as one: it looks like a ship to those it's hostile to. */
function findClosestHostile(gameState: GameState, ship: Ship, position: Vector2D, time: number): GameObject | undefined {
    const registry = gameState.factionRegistry;
    let closest: GameObject | undefined;
    let closestDistanceSq = Infinity;

    for (const other of gameState.objects.values()) {
        if (other === ship || !(other instanceof Ship || other instanceof SensorGhost) || !registry.areHostile(ship, other)) {
            continue;
        }

        const otherDistanceSq = distanceSq(position, other.getPosition(time));
        if (otherDistanceSq < closestDistanceSq) {
            closest = other;
            closestDistanceSq = otherDistanceSq;
        }
    }

    return closest;
}

/** Where a ship flying relative to another ship wants to be at some time, and which way it wants to face there. Either is left out to keep to where, or the way, it is now. */
type Station = { position?: Vector2D; facing?: number };

/** Works out the station for the given time, for a ship that is at the given place at that point in its planned move. */
type StationPlan = (time: number, from: Vector2D) => Station;

/** How fast a ship keeping station can move, in units per second (before its maneuver speed is applied), and turn, in radians per millisecond. */
type StationLimits = { speed: number; turnRate: number };

const defaultStationLimits: StationLimits = { speed: stationMaxSpeed, turnRate: lockOnTurnRate };

/**
 * Have the ship head for its station for the next few steps, no further than the given end time, moving no faster than the limits allow (the station speed,
 * unless a card says otherwise), while turning to face the way the station says, no faster than they allow either (the locked-on turn rate, unless a card says otherwise).
 * Planning uses the same short keyframes as Lock On, and each step heads for where the station will be at that step's time.
 */
function steerToStation(gameState: GameState, ship: Ship, endTime: number, plan: StationPlan, limits: StationLimits = defaultStationLimits) {
    const startTime = gameState.currentTime;
    const position = ship.getPosition(startTime);
    const maxSpeed = limits.speed * ship.helmState.maneuverSpeedMultiplier / 1000;

    // Start from a "now" keyframe, so the move carries on from wherever the ship currently is.
    const keyframes = [new MotionKeyframe(startTime, position.x, position.y, position.angle)];
    let { x, y, angle } = position;
    let time = startTime;

    for (let step = 1; step <= lockOnStepsAhead && time < endTime; step++) {
        const stepTime = Math.min(startTime + step * lockOnStepDuration, endTime);
        const stepDuration = stepTime - time;
        const station = plan(stepTime, { x, y });

        if (station.position) {
            const toStation = { x: station.position.x - x, y: station.position.y - y };
            const stationDistance = Math.hypot(toStation.x, toStation.y);
            const moveDistance = Math.min(stationDistance, maxSpeed * stepDuration);
            if (stationDistance > 0) {
                x += toStation.x / stationDistance * moveDistance;
                y += toStation.y / stationDistance * moveDistance;
            }
        }

        if (station.facing !== undefined) {
            const maxTurn = limits.turnRate * stepDuration;
            angle += Math.max(-maxTurn, Math.min(maxTurn, clampAngle(station.facing - angle)));
        }

        time = stepTime;
        keyframes.push(new MotionKeyframe(time, x, y, angle));
    }

    ship.setMotion(...keyframes);
}

/**
 * Have the ship fly a maneuver relative to the target ship, for the card's `duration` (in seconds), re-planning its motion every step until it ends.
 * The plan is made once, as the maneuver starts: it can refuse (by returning null), which stops the card being played. Losing sight of the target calls the maneuver off.
 */
function startRelativeManeuver(
    gameState: GameState,
    ship: Ship,
    target: GameObject,
    parameters: CardParameters,
    card: CardState,
    makePlan: (startTime: number) => StationPlan | null,
    /** Called on every update while the maneuver carries on, for cards that do something else as it goes. */
    onStep?: (currentTime: number) => void,
    /** How fast the ship can move and turn, if not as any ship keeping station does. */
    limits: StationLimits = defaultStationLimits
): boolean {
    const startTime = gameState.currentTime;
    const endTime = startTime + (parameters['duration'] ?? 0) * 1000;

    const plan = makePlan(startTime);
    if (!plan) {
        return false;
    }

    steerToStation(gameState, ship, endTime, plan, limits);
    ship.helmState.setActiveManeuver(new CardCooldownState(card, startTime, endTime, parameters['cost']));

    // Keep planning the move a short way ahead until the maneuver ends.
    let lastSteerTime = startTime;
    ship.helmState.whileActiveManeuverFlies((currentTime) => {
        if (ship.helmState.resolveShipTarget(target.id) !== target) {
            ship.helmState.cancelActiveManeuver();
        } else {
            if (currentTime - lastSteerTime >= lockOnStepDuration) {
                lastSteerTime = currentTime;
                steerToStation(gameState, ship, endTime, plan, limits);
            }
            onStep?.(currentTime);
        }
    });
    return true;
}

/**
 * The plan for circling the target ship at the range the ship starts at, or null if that's too close to circle.
 * The ship's heading is along the circle, keeping the target square to one side, unless it's to face the target all the way round.
 */
function planCircle(ship: Ship, target: GameObject, startTime: number, pivot: boolean): StationPlan | null {
    const position = ship.getPosition(startTime);
    const targetPosition = target.getPosition(startTime);

    // Circle at the range the ship starts at, which can't be so close that it would have to turn faster than it can.
    const radius = Math.hypot(position.x - targetPosition.x, position.y - targetPosition.y);
    if (radius < orbitMinRadius) {
        return null;
    }

    // Go whichever way round needs the smaller turn from the ship's heading to start with.
    // The bearing is measured as Math.atan2 does, the opposite way round to a ship's angle, so headings along the circle are negated to compare them with one.
    const startBearing = Math.atan2(position.y - targetPosition.y, position.x - targetPosition.x);
    const turnOneWay = Math.abs(clampAngle(-(startBearing + Math.PI / 2) - position.angle));
    const turnTheOther = Math.abs(clampAngle(-(startBearing - Math.PI / 2) - position.angle));
    const direction = turnOneWay <= turnTheOther ? 1 : -1;
    const angularSpeed = orbitSpeed / 1000 / radius;

    return (time, from) => {
        const targetAt = target.getPosition(time);
        const bearing = startBearing + direction * angularSpeed * (time - startTime);

        return {
            position: { x: targetAt.x + Math.cos(bearing) * radius, y: targetAt.y + Math.sin(bearing) * radius },
            facing: pivot ? determineAngle(from, targetAt) : -(bearing + direction * Math.PI / 2),
        };
    };
}

export const cards = defineEngineCards(sharedCards, {
    warpAway: {
        play: (gameState, ship) => {
            return gameState.campaign?.warpAway(ship) === true;
        },
    },
    slowAndSteady: {
        aiEvaluator: locationCardEvaluator('slowAndSteady'),
        play: applyMotionCard,
    },
    backAway: {
        aiEvaluator: locationCardEvaluator('backAway'),
        play: applyMotionCard,
    },
    zigZag: {
        synergy: { provides: ['momentum'] },
        aiEvaluator: locationCardEvaluator('zigZag'),
        play: applyMotionCard,
    },
    sharpTurn: {
        synergy: { provides: ['momentum'] },
        aiEvaluator: locationCardEvaluator('sharpTurn'),
        play: applyMotionCard,
    },
    strafe: {
        aiEvaluator: locationCardEvaluator('strafe'),
        play: applyMotionCard,
    },
    sweepLeft: {
        aiEvaluator: locationCardEvaluator('sweepLeft'),
        play: applyMotionCard,
    },
    sweepRight: {
        aiEvaluator: locationCardEvaluator('sweepRight'),
        play: applyMotionCard,
    },
    pivot: {
        synergy: { provides: ['steadyPlatform'] },
        aiEvaluator: locationCardEvaluator('pivot'),
        play: applyMotionCard,
    },
    sweep: {
        synergy: { provides: ['momentum'] },
        aiEvaluator: choiceEvaluator(['sweepLeft', 'sweepRight']),
    },
    burn: {
        synergy: { provides: ['momentum'] },
        aiEvaluator: locationCardEvaluator('burn'),
        play: playMomentumBuilder,
    },
    punchIt: {
        synergy: { wants: ['momentum'] },
        aiEvaluator: locationCardEvaluator('punchIt'),
        play: (gameState, ship, cardInstance, cardDefinition, location, parameters) => {
            // The Momentum held before this maneuver starts is what speeds it up: starting it can add a level, which only counts towards later ones.
            const momentum = getMomentum(ship);
            const speedMultiplier = 1 + momentum * (parameters['speedPerMomentum'] ?? 0) / 100;

            if (!applyMotionCard(gameState, ship, cardInstance, { ...cardDefinition, baseSpeed: cardDefinition.baseSpeed * speedMultiplier }, location, parameters)) {
                return false;
            }

            // The card itself is harder to hit with for as long as it's being flown, as that's where a maneuver's evasion is read from.
            const extraEvasion = momentum * (parameters['evasionPerMomentum'] ?? 0);
            if (extraEvasion !== 0) {
                cardInstance.modifyParameter('evasion', extraEvasion);
                ship.helmState.whenActiveManeuverEnds(() => cardInstance.modifyParameter('evasion', -extraEvasion));
            }

            // Spend half of that Momentum, rounded up.
            spendMomentum(ship, Math.ceil(momentum / 2));
            return true;
        },
    },
    drift: {
        synergy: { wants: ['momentum'] },
        play: (gameState, ship, cardInstance, _cardDefinition, location, parameters) => {
            const momentum = getMomentum(ship);
            if (momentum <= 0) {
                return false;
            }

            // Which way the ship is going, and how fast, from where its motion has it a moment from now.
            const now = gameState.currentTime;
            const start = ship.getPosition(now);
            const soon = ship.getPosition(now + driftSampleTime);
            const velocity = { x: (soon.x - start.x) / driftSampleTime * 1000, y: (soon.y - start.y) / driftSampleTime * 1000 };

            const path = calculateDriftPath(start, velocity, momentum * (parameters['distancePerMomentum'] ?? 0), location);
            if (!path) {
                return false;
            }

            ship.setMotion(...path.map(keyframe => new MotionKeyframe(now + keyframe.time, keyframe.x, keyframe.y, keyframe.angle)));
            ship.helmState.setActiveManeuver(new CardCooldownState(cardInstance, now, now + path[path.length - 1].time, parameters['cost']));

            // The card itself is harder to hit with for as long as it's being flown, as that's where a maneuver's evasion is read from.
            const extraEvasion = momentum * (parameters['evasionPerMomentum'] ?? 0);
            if (extraEvasion !== 0) {
                cardInstance.modifyParameter('evasion', extraEvasion);
                ship.helmState.whenActiveManeuverEnds(() => cardInstance.modifyParameter('evasion', -extraEvasion));
            }

            // All the Momentum is spent, including any level that starting this maneuver just added.
            spendMomentum(ship, getMomentum(ship));
            return true;
        },
    },
    // The cards below that take no target have no AI evaluator, so the AI never plays them.
    overdrive: {
        synergy: { provides: ['momentum', 'flux'] },
        play: (_gameState, ship) => {
            // Playing it again while it lasts starts its time over.
            ship.helmState.addEffect('overdrive');
            return true;
        },
    },
    hairpin: {
        synergy: { wants: ['momentum'] },
        play: (gameState, ship, parameters, card) => {
            const momentum = getMomentum(ship);

            // Turn away from the nearest hostile ship, so as not to swing into it.
            const now = gameState.currentTime;
            const start = ship.getPosition(now);
            const side = getSideAwayFrom(start, findClosestHostile(gameState, ship, start, now)?.getPosition(now));
            const speed = hairpinSpeed * ship.helmState.maneuverSpeedMultiplier;
            const path = calculateHairpinPath(start, side, (parameters['distance'] ?? 0) + momentum * (parameters['distancePerMomentum'] ?? 0), speed);

            ship.setMotion(...path.map(keyframe => new MotionKeyframe(now + keyframe.time, keyframe.x, keyframe.y, keyframe.angle)));
            ship.helmState.setActiveManeuver(new CardCooldownState(card, now, now + path[path.length - 1].time, parameters['cost']));

            // The card itself is harder to hit with for as long as it's being flown, as that's where a maneuver's evasion is read from.
            const extraEvasion = momentum * (parameters['evasionPerMomentum'] ?? 0);
            if (extraEvasion !== 0) {
                card.modifyParameter('evasion', extraEvasion);
                ship.helmState.whenActiveManeuverEnds(() => card.modifyParameter('evasion', -extraEvasion));
            }

            // All the Momentum is spent, including any level that starting this maneuver just added.
            spendMomentum(ship, getMomentum(ship));
            return true;
        },
    },
    juke: {
        synergy: { wants: ['momentum'] },
        play: (gameState, ship, parameters, card) => {
            const momentumCost = parameters['momentumCost'] ?? 0;
            if (getMomentum(ship) < momentumCost) {
                return false;
            }

            // Step away from the nearest hostile ship.
            const now = gameState.currentTime;
            const start = ship.getPosition(now);
            const side = getSideAwayFrom(start, findClosestHostile(gameState, ship, start, now)?.getPosition(now));
            const path = calculateJukePath(start, side, parameters['distance'] ?? 0);

            ship.setMotion(...path.map(keyframe => new MotionKeyframe(now + keyframe.time, keyframe.x, keyframe.y, keyframe.angle)));
            ship.helmState.setActiveManeuver(new CardCooldownState(card, now, now + jukeDuration, parameters['cost']));
            spendMomentum(ship, momentumCost);

            // Every ship aiming at this one loses its aim on it. (A sensor ghost has no weapons.)
            for (const other of gameState.objects.values()) {
                if (other !== ship && other instanceof Ship) {
                    other.tacticalState.loseAimOn(ship.id);
                }
            }
            return true;
        },
    },
    evasiveManeuvers: {},
    patternAlpha: { play: playEvasivePattern('patternAlpha') },
    patternBeta: { play: playEvasivePattern('patternBeta') },
    patternGamma: { play: playEvasivePattern('patternGamma') },
    broadside: {
        aiEvaluator: locationCardEvaluator('broadside'),
        play: (gameState, ship, cardInstance, cardDefinition, location, parameters) => {
            // It turns towards the closest hostile ship, as of when it sets off.
            const time = gameState.currentTime;
            const hostile = findClosestHostile(gameState, ship, ship.getPosition(time), time);
            return applyMotionCard(gameState, ship, cardInstance, cardDefinition, location, parameters, { hostilePosition: hostile?.getPosition(time) });
        },
    },
    // The AI never plays this, as it has no evaluator.
    slingshot: {
        synergy: { provides: ['momentum'] },
        play: (gameState, ship, cardInstance, cardDefinition, location, parameters) => {
            // It swings round the closest hostile ship, as of when it sets off, so it can't be played with none.
            const time = gameState.currentTime;
            const hostile = findClosestHostile(gameState, ship, ship.getPosition(time), time);
            if (!hostile || !applyMotionCard(gameState, ship, cardInstance, cardDefinition, location, parameters, { hostilePosition: hostile.getPosition(time) })) {
                return false;
            }

            ship.helmState.adjustEffectLevel('momentum', parameters['momentum']);
            return true;
        },
    },
    lockOn: {
        synergy: { provides: ['steadyPlatform'] },
        play: (gameState, ship, target, parameters, card) => {
            // Stop, then keep turning to face the target, wherever it goes. The ship stays where it stopped, as no station position is given.
            const played = startRelativeManeuver(gameState, ship, target, parameters, card, () => (time, from) => ({
                facing: determineAngle(from, target.getPosition(time)),
            }));
            if (!played) {
                return false;
            }

            // The ship's own weapons are more accurate until the lock ends, even if that's early.
            const helm = ship.helmState;
            helm.removeEffect('holdingSteady', 'expired');
            helm.adjustEffectLevel('holdingSteady', parameters['accuracy']);
            helm.whenActiveManeuverEnds(() => helm.removeEffect('holdingSteady', 'expired'));
            return true;
        },
    },
    standOff: {
        synergy: { provides: ['steadyPlatform'] },
        play: (gameState, ship, target, parameters, card) => {
            // Keep the range the ship starts at, or the card's range if that's further, by backing straight away from the target when it comes closer. It never closes in.
            const startTime = gameState.currentTime;
            const range = Math.max(parameters['range'] ?? 0, Math.sqrt(distanceSq(ship.getPosition(startTime), target.getPosition(startTime))));

            return startRelativeManeuver(gameState, ship, target, parameters, card, () => (time, from) => {
                const targetAt = target.getPosition(time);
                const facing = determineAngle(from, targetAt);
                const gap = Math.hypot(from.x - targetAt.x, from.y - targetAt.y);
                if (gap >= range || gap < 1e-6) {
                    return { facing };
                }

                const scale = range / gap;
                return { position: { x: targetAt.x + (from.x - targetAt.x) * scale, y: targetAt.y + (from.y - targetAt.y) * scale }, facing };
            });
        },
    },
    orbit: {
        synergy: { provides: ['momentum'] },
        play: (gameState, ship, target, parameters, card) => {
            // Circling builds Momentum: a level for every interval spent at it.
            const interval = (parameters['momentumInterval'] ?? 0) * 1000;
            let lastMomentumTime = gameState.currentTime;

            return startRelativeManeuver(gameState, ship, target, parameters, card, startTime => planCircle(ship, target, startTime, false), (currentTime) => {
                while (interval > 0 && currentTime - lastMomentumTime >= interval) {
                    lastMomentumTime += interval;
                    ship.helmState.adjustEffectLevel('momentum', parameters['momentum']);
                }
            });
        },
    },
    circleStrafe: {
        play: (gameState, ship, target, parameters, card) => startRelativeManeuver(gameState, ship, target, parameters, card, startTime => planCircle(ship, target, startTime, true)),
    },
    interpose: {
        play: (gameState, ship, target, parameters, card) => {
            const played = startRelativeManeuver(gameState, ship, target, parameters, card, () => (time, from) => {
                // Whichever hostile ship is closest to the target at the time is the one to get in front of. With none about, the ship stays where it is.
                const targetAt = target.getPosition(time);
                const hostile = findClosestHostile(gameState, ship, targetAt, time);
                if (!hostile) {
                    return {};
                }

                const hostileAt = hostile.getPosition(time);
                const gap = Math.hypot(hostileAt.x - targetAt.x, hostileAt.y - targetAt.y);
                if (gap === 0) {
                    return {};
                }

                // Half way between them, or no further from the target than the interpose distance when they're far apart.
                const along = Math.min(gap / 2, interposeDistance) / gap;
                return {
                    position: { x: targetAt.x + (hostileAt.x - targetAt.x) * along, y: targetAt.y + (hostileAt.y - targetAt.y) * along },
                    facing: determineAngle(from, hostileAt),
                };
            });

            // While it holds its place, shots at the target ship that pass through it are taken by it (see `getInterceptingShip`). That ends with the maneuver, however it ends.
            if (played && target instanceof Ship && screenShip(ship, target)) {
                ship.helmState.whenActiveManeuverEnds(() => unscreenShip(ship, target));
            }
            return played;
        },
    },
    shadow: {
        play: (gameState, ship, target, parameters, card) => {
            if (!startRelativeManeuver(gameState, ship, target, parameters, card, () => (time, from) => {
                // The station is directly behind the target, whichever way it's heading, and the ship faces the target from there.
                // A ship's angle goes the opposite way round to Math.atan2's, so it points along (cos, -sin).
                const targetAt = target.getPosition(time);
                return {
                    position: { x: targetAt.x - Math.cos(targetAt.angle) * shadowDistance, y: targetAt.y + Math.sin(targetAt.angle) * shadowDistance },
                    facing: determineAngle(from, targetAt),
                };
            })) {
                return false;
            }

            // The ship's weapons ignore the target's evasion for as long as it's within the rear arc, until the maneuver ends however it ends (see `TacticalState.determineAccuracy`).
            // Starting this maneuver has already ended any earlier shadow, and the effect with it.
            const helm = ship.helmState;
            helm.shadowTargetId = target.id;
            helm.shadowRearArc = (parameters['rearArc'] ?? 0) * Math.PI / 180;
            helm.addEffect('shadowing');
            helm.whenActiveManeuverEnds(() => helm.removeEffect('shadowing', 'expired'));
            return true;
        },
    },
    pirouette: {
        synergy: { wants: ['momentum'] },
        play: (gameState, ship, target, parameters, card) => {
            const momentumCost = parameters['momentumCost'] ?? 0;
            if (getMomentum(ship) < momentumCost) {
                return false;
            }

            // Straight in to the circle round the target, then half way round it, facing it all the way, then still on its far side until the maneuver ends.
            // It goes round whichever way passes behind the target, rather than across its front. The circle is worked out from where the target is as it moves.
            const radius = parameters['radius'] ?? 0;
            const startTime = gameState.currentTime;
            const start = ship.getPosition(startTime);
            const targetStart = target.getPosition(startTime);
            const speed = pirouetteSpeed * ship.helmState.maneuverSpeedMultiplier;
            const gap = Math.hypot(start.x - targetStart.x, start.y - targetStart.y);
            const duration = (Math.abs(gap - radius) + Math.PI * radius) / speed + pirouetteHoldTime / 1000;

            // Angles round the target here are in the map's terms (as Math.atan2 gives them), not ships' angles.
            let circle: { startTime: number; startAngle: number; direction: number } | null = null;
            const onCircle = (targetAt: Vector2D, angle: number) => ({ x: targetAt.x + Math.cos(angle) * radius, y: targetAt.y + Math.sin(angle) * radius });

            // It faces the target from where it's heading for at each step, rather than from where it starts that step, or going round it'd always be a step behind.
            const station = (targetAt: Vector2D, position: Vector2D) => ({ position, facing: determineAngle(position, targetAt) });

            const played = startRelativeManeuver(gameState, ship, target, { ...parameters, duration }, card, () => (time, from) => {
                const targetAt = target.getPosition(time);

                if (!circle) {
                    const offset = { x: from.x - targetAt.x, y: from.y - targetAt.y };
                    const range = Math.hypot(offset.x, offset.y);
                    const angle = range > 1e-6 ? Math.atan2(offset.y, offset.x) : 0;
                    if (Math.abs(range - radius) > pirouetteTolerance) {
                        return { position: onCircle(targetAt, angle), facing: determineAngle(from, targetAt) };
                    }

                    // The target faces along (cos, -sin) of its angle. The way round whose half way point is further behind it is the way to go.
                    const ahead = (direction: number) => Math.cos(angle + direction * Math.PI / 2) * Math.cos(targetAt.angle) - Math.sin(angle + direction * Math.PI / 2) * Math.sin(targetAt.angle);
                    circle = { startTime: time, startAngle: angle, direction: ahead(1) <= ahead(-1) ? 1 : -1 };
                }

                const swept = Math.max(0, Math.min(Math.PI, (time - circle.startTime) / 1000 * speed / radius));
                return station(targetAt, onCircle(targetAt, circle.startAngle + circle.direction * swept));
            }, undefined, { speed: pirouetteSpeed * 1.2, turnRate: pirouetteTurnRate });
            if (!played) {
                return false;
            }

            spendMomentum(ship, momentumCost);
            return true;
        },
    },
    attackRun: {
        play: (gameState, ship, target, parameters, card) => {
            // A pass at the target, facing it all the way: in alongside it, on whichever side of it the ship is on, then round behind it, where it stays.
            // A ship that starts behind the target goes straight there. The stations are worked out from where the target is, and faces, as it moves.
            const passDistance = parameters['passDistance'] ?? 0;
            const startTime = gameState.currentTime;
            const start = ship.getPosition(startTime);
            const targetStart = target.getPosition(startTime);

            // The target faces along (cos, -sin) of its angle, so its left is along (-sin, -cos).
            const offset = { x: start.x - targetStart.x, y: start.y - targetStart.y };
            const ahead = offset.x * Math.cos(targetStart.angle) - offset.y * Math.sin(targetStart.angle);
            const leftness = -offset.x * Math.sin(targetStart.angle) - offset.y * Math.cos(targetStart.angle);
            const side = leftness >= 0 ? 1 : -1;
            let passed = ahead < 0;

            const played = startRelativeManeuver(gameState, ship, target, parameters, card, () => (time, from) => {
                const targetAt = target.getPosition(time);
                const facing = determineAngle(from, targetAt);
                const alongside = {
                    x: targetAt.x + side * passDistance * -Math.sin(targetAt.angle),
                    y: targetAt.y + side * passDistance * -Math.cos(targetAt.angle),
                };

                if (!passed && Math.hypot(alongside.x - from.x, alongside.y - from.y) > attackRunPassTolerance) {
                    return { position: alongside, facing };
                }
                passed = true;

                const behind = { x: targetAt.x - passDistance * Math.cos(targetAt.angle), y: targetAt.y + passDistance * Math.sin(targetAt.angle) };
                return { position: behind, facing };
            });
            if (!played) {
                return false;
            }

            // Tactical has more power for as long as this maneuver is flown, even if it's called off early.
            // Starting this maneuver has already ended any earlier attack run, and the power with it.
            const tactical = ship.tacticalState;
            tactical.adjustEffectLevel('attackRun', parameters['power']);
            ship.helmState.whenActiveManeuverEnds(() => tactical.removeEffect('attackRun', 'expired'));
            return true;
        },
    },
});

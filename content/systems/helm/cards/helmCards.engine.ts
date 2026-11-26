import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { clampAngle, determineAngle, distanceSq } from 'common-data/features/space/utils/vectors';
import { screenShip, unscreenShip } from 'content/systems/helm/effects/helmEffects.engine';
import { choiceEvaluator } from 'engine/ai/evaluators';
import { locationCardEvaluator } from 'engine/ai/evaluators/helm';
import { applyMotionCard } from 'engine/cards/applyMotionCard';
import { LocationTargetCardFunctionality } from 'engine/cards/EngineCardDefinition';
import { defineEngineCards } from 'engine/content/EngineContent';
import { CardCooldownState } from 'engine/state/CardCooldownState';
import { CardState } from 'engine/state/CardState';
import { GameObject } from 'engine/state/GameObject';
import { GameState } from 'engine/state/GameState';
import { MotionKeyframe } from 'engine/state/MotionKeyframe';
import { SensorGhost } from 'engine/state/SensorGhost';
import { Ship } from 'engine/state/Ship';
import { cards as sharedCards } from './helmCards.shared';

/** How far to each side of where it started a jinking ship goes, and how many times it changes side. */
const jinkDistance = 0.4;
const jinkCount = 4;

/** How far ahead a locked-on ship plans its turning each time, in milliseconds per keyframe, and how many keyframes ahead it plans. It plans again after each step. */
const lockOnStepDuration = 250;
const lockOnStepsAhead = 3;

/** How fast a locked-on ship turns, in radians per millisecond: 180 degrees in 4 seconds, as fast as Face Target turns. */
const lockOnTurnRate = Math.PI / 4000;

/** How fast a ship matching course can move to keep its station, in units per second: as fast as Burn flies. */
const matchCourseMaxSpeed = 1.5;

/** How fast an orbiting ship goes round, in units per second, and the smallest circle it will fly. */
const orbitSpeed = 1;
const orbitMinRadius = 1.5;

/** How far from the ship it's protecting an interposing ship sits, at most, in units. */
const interposeDistance = 3;

/** How far behind its target a shadowing ship stays, in units. */
const shadowDistance = 2.5;

/** How fast a ship breaking away turns (as Burn does, where 1 is 180 degrees in 4 seconds) and flies, in units per second. */
const breakAwayRotationSpeed = 1;
const breakAwaySpeed = 1.5;

/** How many levels of Momentum the ship's helm holds. */
function getMomentum(ship: Ship): number {
    return ship.helmState.getEffects().find(effect => effect.type === 'momentum')?.level ?? 0;
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
 * Have the ship fly a posture: a maneuver that lasts for the card's `duration` (in seconds) and ends where it began.
 * It stays put throughout, unless it's given offsets to pass through on the way: distances to the right of its heading (negative for left), evenly spaced in time.
 */
function startPosture(gameState: GameState, ship: Ship, card: CardState, parameters: CardParameters, sidewaysOffsets: number[] = []) {
    const startTime = gameState.currentTime;
    const endTime = startTime + (parameters['duration'] ?? 0) * 1000;
    const position = ship.getPosition(startTime);
    const stepDuration = (endTime - startTime) / (sidewaysOffsets.length + 1);

    // The unit vector pointing to the right of the ship's heading.
    const right = { x: -Math.sin(position.angle), y: Math.cos(position.angle) };

    ship.setMotion(
        new MotionKeyframe(startTime, position.x, position.y, position.angle),
        ...sidewaysOffsets.map((offset, index) => new MotionKeyframe(
            startTime + stepDuration * (index + 1),
            position.x + right.x * offset,
            position.y + right.y * offset,
            position.angle
        )),
        new MotionKeyframe(endTime, position.x, position.y, position.angle)
    );

    ship.helmState.setActiveManeuver(new CardCooldownState(card, startTime, endTime, parameters['cost']));
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

/**
 * Have the ship turn on the spot towards the closest hostile ship, for the next few steps (no further than the given end time), at the locked-on turn rate.
 * Each keyframe faces as close to where that ship will be at its time as the turn rate allows. With no hostile ship, it holds its heading.
 */
function steerTowardsClosestHostile(gameState: GameState, ship: Ship, endTime: number) {
    const startTime = gameState.currentTime;
    const position = ship.getPosition(startTime);
    const target = findClosestHostile(gameState, ship, position, startTime);

    // Start from a "now" keyframe, so the turn carries on from wherever the ship currently is.
    const keyframes = [new MotionKeyframe(startTime, position.x, position.y, position.angle)];
    let angle = position.angle;
    let time = startTime;

    for (let step = 1; step <= lockOnStepsAhead && time < endTime; step++) {
        const stepTime = Math.min(startTime + step * lockOnStepDuration, endTime);

        if (target) {
            const targetPosition = target.getPosition(stepTime);
            const wantedAngle = determineAngle(position, targetPosition);
            const maxTurn = lockOnTurnRate * (stepTime - time);
            angle += Math.max(-maxTurn, Math.min(maxTurn, clampAngle(wantedAngle - angle)));
        }

        time = stepTime;
        keyframes.push(new MotionKeyframe(time, position.x, position.y, angle));
    }

    ship.setMotion(...keyframes);
}

/** Where a ship flying relative to another ship wants to be at some time, and which way it wants to face there. Either is left out to keep to where, or the way, it is now. */
type Station = { position?: Vector2D; facing?: number };

/** Works out the station for the given time, for a ship that is at the given place at that point in its planned move. */
type StationPlan = (time: number, from: Vector2D) => Station;

/**
 * Have the ship head for its station for the next few steps, no further than the given end time, moving no faster than Match Course allows,
 * while turning to face the way the station says at the locked-on turn rate.
 * Planning uses the same short keyframes as Lock On, and each step heads for where the station will be at that step's time.
 */
function steerToStation(gameState: GameState, ship: Ship, endTime: number, plan: StationPlan) {
    const startTime = gameState.currentTime;
    const position = ship.getPosition(startTime);
    const maxSpeed = matchCourseMaxSpeed * ship.helmState.maneuverSpeedMultiplier / 1000;

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
            const maxTurn = lockOnTurnRate * stepDuration;
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
    makePlan: (startTime: number) => StationPlan | null
): boolean {
    const startTime = gameState.currentTime;
    const endTime = startTime + (parameters['duration'] ?? 0) * 1000;

    const plan = makePlan(startTime);
    if (!plan) {
        return false;
    }

    steerToStation(gameState, ship, endTime, plan);
    ship.helmState.setActiveManeuver(new CardCooldownState(card, startTime, endTime, parameters['cost']));

    // Keep planning the move a short way ahead until the maneuver ends.
    let lastSteerTime = startTime;
    ship.helmState.whileActiveManeuverFlies((currentTime) => {
        if (ship.helmState.resolveShipTarget(target.id) !== target) {
            ship.helmState.cancelActiveManeuver();
        } else if (currentTime - lastSteerTime >= lockOnStepDuration) {
            lastSteerTime = currentTime;
            steerToStation(gameState, ship, endTime, plan);
        }
    });
    return true;
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
    slowReverse: {
        aiEvaluator: locationCardEvaluator('slowReverse'),
        play: applyMotionCard,
    },
    zigZag: {
        synergy: { provides: ['momentum'] },
        aiEvaluator: locationCardEvaluator('zigZag'),
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
    faceTarget: {
        synergy: { provides: ['steadyPlatform'] },
        aiEvaluator: locationCardEvaluator('faceTarget'),
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
    fullImpulse: {
        synergy: { wants: ['momentum'] },
        aiEvaluator: locationCardEvaluator('fullImpulse'),
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
            ship.helmState.adjustEffectLevel('momentum', -Math.ceil(momentum / 2));
            return true;
        },
    },
    // The cards below that take no target have no AI evaluator, so the AI never plays them.
    evasivePattern: {
        play: (gameState, ship, parameters, card) => {
            // Jink from one side to the other and back to the middle. The evasion comes from the card being flown.
            const offsets = new Array<number>(jinkCount).fill(0).map((_, index) => (index % 2 === 0 ? jinkDistance : -jinkDistance));
            startPosture(gameState, ship, card, parameters, offsets);

            // The ship's own weapons are less accurate until the jinking stops, even if that's early.
            const helm = ship.helmState;
            helm.removeEffect('jinking', 'expired');
            helm.adjustEffectLevel('jinking', parameters['accuracyLoss']);
            helm.whenActiveManeuverEnds(() => helm.removeEffect('jinking', 'expired'));
            return true;
        },
    },
    holdSteady: {
        synergy: { wants: ['steadyPlatform'] },
        play: (gameState, ship, parameters, card) => {
            startPosture(gameState, ship, card, parameters);

            // The ship's own weapons are more accurate until it stops holding still, even if that's early.
            const helm = ship.helmState;
            helm.removeEffect('holdingSteady', 'expired');
            helm.adjustEffectLevel('holdingSteady', parameters['accuracy']);
            helm.whenActiveManeuverEnds(() => helm.removeEffect('holdingSteady', 'expired'));
            return true;
        },
    },
    broadsideLeft: {
        aiEvaluator: locationCardEvaluator('broadsideLeft'),
        play: applyMotionCard,
    },
    broadsideRight: {
        aiEvaluator: locationCardEvaluator('broadsideRight'),
        play: applyMotionCard,
    },
    broadside: {
        aiEvaluator: choiceEvaluator(['broadsideLeft', 'broadsideRight']),
    },
    slingshotLeft: {
        aiEvaluator: locationCardEvaluator('slingshotLeft'),
        play: playMomentumBuilder,
    },
    slingshotRight: {
        aiEvaluator: locationCardEvaluator('slingshotRight'),
        play: playMomentumBuilder,
    },
    slingshot: {
        synergy: { provides: ['momentum'] },
        aiEvaluator: choiceEvaluator(['slingshotLeft', 'slingshotRight']),
    },
    lockOn: {
        synergy: { provides: ['steadyPlatform'] },
        play: (gameState, ship, parameters, card) => {
            const startTime = gameState.currentTime;
            const endTime = startTime + (parameters['duration'] ?? 0) * 1000;

            steerTowardsClosestHostile(gameState, ship, endTime);
            ship.helmState.setActiveManeuver(new CardCooldownState(card, startTime, endTime, parameters['cost']));

            // Keep planning the turn a short way ahead, picking whichever hostile ship is closest each time, until the maneuver ends.
            let lastSteerTime = startTime;
            ship.helmState.whileActiveManeuverFlies((currentTime) => {
                if (currentTime - lastSteerTime >= lockOnStepDuration) {
                    lastSteerTime = currentTime;
                    steerTowardsClosestHostile(gameState, ship, endTime);
                }
            });
            return true;
        },
    },
    matchCourse: {
        play: (gameState, ship, target, parameters, card) => startRelativeManeuver(gameState, ship, target, parameters, card, (startTime) => {
            // The station to keep is wherever the ship is now, relative to the target.
            const position = ship.getPosition(startTime);
            const targetPosition = target.getPosition(startTime);
            const offset = { x: position.x - targetPosition.x, y: position.y - targetPosition.y };

            return (time) => {
                const targetAt = target.getPosition(time);
                return { position: { x: targetAt.x + offset.x, y: targetAt.y + offset.y }, facing: targetAt.angle };
            };
        }),
    },
    orbit: {
        play: (gameState, ship, target, parameters, card) => startRelativeManeuver(gameState, ship, target, parameters, card, (startTime) => {
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

            return (time) => {
                const targetAt = target.getPosition(time);
                const bearing = startBearing + direction * angularSpeed * (time - startTime);

                // The ship's heading is along the circle, which keeps the target square to one side.
                return {
                    position: { x: targetAt.x + Math.cos(bearing) * radius, y: targetAt.y + Math.sin(bearing) * radius },
                    facing: -(bearing + direction * Math.PI / 2),
                };
            };
        }),
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
        play: (gameState, ship, target, parameters, card) => startRelativeManeuver(gameState, ship, target, parameters, card, () => (time, from) => {
            // The station is directly behind the target, whichever way it's heading, and the ship faces the target from there.
            // A ship's angle goes the opposite way round to Math.atan2's, so it points along (cos, -sin).
            const targetAt = target.getPosition(time);
            return {
                position: { x: targetAt.x - Math.cos(targetAt.angle) * shadowDistance, y: targetAt.y + Math.sin(targetAt.angle) * shadowDistance },
                facing: determineAngle(from, targetAt),
            };
        }),
    },
    breakAway: {
        synergy: { provides: ['momentum'] },
        play: (gameState, ship, target, parameters, card) => {
            const startTime = gameState.currentTime;
            const position = ship.getPosition(startTime);
            const targetPosition = target.getPosition(startTime);

            // Directly away from the target, or straight ahead if the ship is right on top of it.
            const awayX = position.x - targetPosition.x;
            const awayY = position.y - targetPosition.y;
            const heading = awayX === 0 && awayY === 0 ? position.angle : determineAngle(targetPosition, position);
            const distance = parameters['distance'] ?? 0;

            // Turn on the spot to face away, then burn in a straight line.
            const keyframes = [new MotionKeyframe(startTime, position.x, position.y, position.angle)];
            let time = startTime;
            const turn = Math.abs(clampAngle(heading - position.angle));
            if (turn > 0.001) {
                time += turn / Math.PI / breakAwayRotationSpeed * 4000;
                keyframes.push(new MotionKeyframe(time, position.x, position.y, heading));
            }
            time += distance / (breakAwaySpeed * ship.helmState.maneuverSpeedMultiplier) * 1000;
            // A ship's angle goes the opposite way round to Math.atan2's, so it points along (cos, -sin).
            keyframes.push(new MotionKeyframe(time, position.x + Math.cos(heading) * distance, position.y - Math.sin(heading) * distance, heading));

            ship.setMotion(...keyframes);
            ship.helmState.setActiveManeuver(new CardCooldownState(card, startTime, time, parameters['cost']));
            ship.helmState.adjustEffectLevel('momentum', parameters['momentum']);
            return true;
        },
    },
    attackRun: {
        play: (gameState, ship, cardInstance, cardDefinition, location, parameters) => {
            if (!applyMotionCard(gameState, ship, cardInstance, cardDefinition, location, parameters)) {
                return false;
            }

            // Tactical's cards cost less for as long as this maneuver is flown, even if it's called off early.
            // Starting this maneuver has already ended any earlier attack run, and the discount with it.
            const tactical = ship.tacticalState;
            tactical.adjustEffectLevel('attackRun', parameters['costReduction']);
            ship.helmState.whenActiveManeuverEnds(() => tactical.removeEffect('attackRun', 'expired'));
            return true;
        },
    },
});

import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { Position } from 'common-data/features/space/types/Position';
import { clampAngle, distanceSq } from 'common-data/features/space/utils/vectors';
import { choiceEvaluator } from 'engine/ai/evaluators';
import { locationCardEvaluator } from 'engine/ai/evaluators/helm';
import { applyMotionCard } from 'engine/cards/applyMotionCard';
import { LocationTargetCardFunctionality } from 'engine/cards/EngineCardDefinition';
import { defineEngineCards } from 'engine/content/EngineContent';
import { CardCooldownState } from 'engine/state/CardCooldownState';
import { CardState } from 'engine/state/CardState';
import { GameState } from 'engine/state/GameState';
import { MotionKeyframe } from 'engine/state/MotionKeyframe';
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

/** The ship hostile to the given one that is closest to where it is, at the given time, if there are any. */
function findClosestHostile(gameState: GameState, ship: Ship, position: Position, time: number): Ship | undefined {
    const registry = gameState.factionRegistry;
    let closest: Ship | undefined;
    let closestDistanceSq = Infinity;

    for (const other of gameState.objects.values()) {
        if (other === ship || !(other instanceof Ship) || !registry.areHostile(ship, other)) {
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
            const wantedAngle = Math.atan2(targetPosition.y - position.y, targetPosition.x - position.x);
            const maxTurn = lockOnTurnRate * (stepTime - time);
            angle += Math.max(-maxTurn, Math.min(maxTurn, clampAngle(wantedAngle - angle)));
        }

        time = stepTime;
        keyframes.push(new MotionKeyframe(time, position.x, position.y, angle));
    }

    ship.setMotion(...keyframes);
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
    fullReverse: {
        aiEvaluator: locationCardEvaluator('fullReverse'),
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
    flyby: {
        synergy: { wants: ['momentum'] },
        aiEvaluator: locationCardEvaluator('flyby'),
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
    hardBrake: {
        synergy: { wants: ['momentum'] },
        play: (_gameState, ship, parameters) => {
            const helm = ship.helmState;
            const momentum = getMomentum(ship);

            // Slow to a stop from whatever is being flown.
            helm.cancelActiveManeuver();

            // Spend every level of Momentum on evasion. Braking again replaces what the last brake gave, so that it lasts its full time.
            helm.removeEffect('momentum', 'expired');
            const evasion = momentum * (parameters['evasionPerMomentum'] ?? 0);
            if (evasion > 0) {
                helm.removeEffect('hardBrakeEvasion', 'expired');
                helm.adjustEffectLevel('hardBrakeEvasion', evasion);
            }

            return true;
        },
    },
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
    brace: {
        synergy: { wants: ['steadyPlatform'] },
        play: (gameState, ship, parameters, card) => {
            startPosture(gameState, ship, card, parameters);

            // Hits on the hull do less damage until the ship stops bracing, even if that's early.
            const hull = ship.hullState;
            hull.removeEffect('braced', 'expired');
            hull.adjustEffectLevel('braced', parameters['hullDamageReduction']);
            ship.helmState.whenActiveManeuverEnds(() => hull.removeEffect('braced', 'expired'));
            return true;
        },
    },
});

import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { Position } from 'common-data/features/space/types/Position';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { clampAngle, determineAngle, distance, serializeVector } from 'common-data/features/space/utils/vectors';
import { getCardDefinition } from 'src/cards/getEngineCardDefinition';
import { AiStance, CandidatePlay, CardEvaluator, EvaluationContext } from '../types';
import { estimateManeuverEndpoint, projectCurrentEndpoint, rangeBandScore } from './helpers';
import type { GameObject } from 'src/state/GameObject';

const CANDIDATE_BEARINGS = [0, Math.PI / 3, -Math.PI / 3, (Math.PI * 2) / 3, -(Math.PI * 2) / 3];

/** A short move straight at the target: the only way to turn to face it with cards that end facing their direction of travel. */
const APPROACH_HOP = 2;
const MIN_MOVE_DISTANCE = 1;

/** Facing the target matters a lot more once a weapon can actually fire. */
const FACING_READY_VALUE = 40;
const FACING_LOADED_VALUE = 15;

function evasionWeight(stance: AiStance): number {
    switch (stance) {
        case 'evasive':
        case 'withdrawing':
            return 0.8;
        case 'aggressive':
            return 0.2;
        default:
            return 0.4;
    }
}

/** A ship sitting still in combat is an easy target, so starting to move is worth something in itself. */
function underwayValue(stance: AiStance): number {
    switch (stance) {
        case 'evasive':
        case 'withdrawing':
            return 30;
        case 'aggressive':
            return 25;
        default:
            return 0;
    }
}

/** The target to maneuver against, or undefined when there isn't one (or we're running from it). */
function getEngagedTarget(ctx: EvaluationContext): GameObject | undefined {
    const bb = ctx.blackboard;
    if (bb.targetId === null || bb.stance === 'withdrawing') {
        return undefined;
    }
    return ctx.gameState.objects.get(bb.targetId);
}

/**
 * Places worth being: a ring around the target at the desired range, plus points straight toward it
 * (which end facing it). With no target to engage, the goal destination.
 */
export function generateCandidateLocations(ctx: EvaluationContext): Vector2D[] {
    const own = ctx.ship.getPosition(ctx.currentTime);
    const bb = ctx.blackboard;
    const locations: Vector2D[] = [];

    const target = getEngagedTarget(ctx);
    if (target) {
        const targetPos = target.getPosition(ctx.currentTime);
        const mid = (bb.desiredRange.min + bb.desiredRange.max) / 2;
        const toUs = { x: own.x - targetPos.x, y: own.y - targetPos.y };
        const base = Math.atan2(toUs.y, toUs.x);
        for (const offset of CANDIDATE_BEARINGS) {
            locations.push({
                x: targetPos.x + Math.cos(base + offset) * mid,
                y: targetPos.y + Math.sin(base + offset) * mid,
            });
        }

        // Don't close in all the way to minimum range: weapons that can fire at point blank would otherwise ram the target.
        const closestApproach = (bb.desiredRange.min + mid) / 2;
        const range = distance(own, targetPos);
        if (range > 0) {
            for (const hop of [APPROACH_HOP, range - mid]) {
                if (hop > 0.5 && range - hop >= closestApproach) {
                    locations.push({
                        x: own.x - (toUs.x / range) * hop,
                        y: own.y - (toUs.y / range) * hop,
                    });
                }
            }
        }
    } else if (bb.destination) {
        locations.push(bb.destination);
    }

    // A "move" to where we already are isn't really one, and its facing would be meaningless.
    return locations.filter(location => distance(own, location) >= MIN_MOVE_DISTANCE);
}

/** Value of pointing a loaded weapon at the target from this pose: highest for a weapon that's ready to fire. */
function facingValue(pos: Position, targetPos: Vector2D, ctx: EvaluationContext): number {
    const bearing = Math.abs(clampAngle(determineAngle(pos, targetPos) - pos.angle));
    let value = 0;
    for (const slot of ctx.ship.tacticalState.slots) {
        if (slot.card && bearing <= slot.getParameter('firingArc')) {
            value = Math.max(value, slot.hasBeenFullyCharged ? FACING_READY_VALUE : FACING_LOADED_VALUE);
        }
    }
    return value;
}

/** How good would it be to end up at this position/facing, with this evasion active? */
export function positionValue(pos: Position, evasion: number, ctx: EvaluationContext): number {
    const bb = ctx.blackboard;
    let value = 0;

    const target = getEngagedTarget(ctx);
    if (target) {
        const targetPos = target.getPosition(ctx.currentTime);
        value += rangeBandScore(distance(pos, targetPos), bb.desiredRange) * 50;
        value += facingValue(pos, targetPos, ctx);
    } else if (bb.destination) {
        value += Math.max(0, 50 - distance(pos, bb.destination) * 2);
    }

    value += evasion * evasionWeight(bb.stance);
    return value;
}

export function currentEvasion(ctx: EvaluationContext): number {
    return ctx.ship.helmState.activeManeuver?.card?.getParameter('evasion') ?? 0;
}

/**
 * Scores each candidate location against where the current motion ends. While a maneuver is running,
 * candidates are flagged as interrupting it: the helm officer cancels it first, then plays the card.
 */
export function locationCardEvaluator(cardType: CardType): CardEvaluator {
    return (card, ctx) => {
        const def = getCardDefinition(cardType);
        if (def.targetType !== 'location') {
            return [];
        }

        const maneuvering = ctx.ship.helmState.activeManeuver !== null;
        const cost = card.getParameter('cost');
        const evasion = def.parameters['evasion'] ?? 0;
        const own = ctx.ship.getPosition(ctx.currentTime);
        const currentValue = positionValue(projectCurrentEndpoint(ctx.ship), currentEvasion(ctx), ctx);
        const startingToMove = !maneuvering && def.baseSpeed > 0 ? underwayValue(ctx.blackboard.stance) : 0;

        const out: CandidatePlay[] = [];
        for (const location of generateCandidateLocations(ctx)) {
            const end = estimateManeuverEndpoint(def, own, location);
            if (!end) {
                continue;
            }
            out.push({
                score: positionValue(end, evasion, ctx) + startingToMove - currentValue,
                cost,
                interrupts: maneuvering,
                action: { kind: 'playCard', cardId: card.id, cardType, targetType: 'location', targetId: serializeVector(location) },
            });
        }
        return out;
    };
}

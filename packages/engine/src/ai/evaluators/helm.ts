import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { Position } from 'common-data/features/space/types/Position';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { clampAngle, determineAngle, distance, serializeVector } from 'common-data/features/space/utils/vectors';
import { getCardDefinition } from 'src/cards/getEngineCardDefinition';
import { AiStance, CandidatePlay, CardEvaluator, EvaluationContext } from '../types';
import { bestWeaponArc, estimateManeuverEndpoint, projectCurrentEndpoint, rangeBandScore } from './helpers';

const CANDIDATE_BEARINGS = [0, Math.PI / 3, -Math.PI / 3, (Math.PI * 2) / 3, -(Math.PI * 2) / 3];

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

/** Places worth being: a ring around the target at the desired range, plus the goal destination. */
export function generateCandidateLocations(ctx: EvaluationContext): Vector2D[] {
    const own = ctx.ship.getPosition(ctx.currentTime);
    const bb = ctx.blackboard;
    const locations: Vector2D[] = [];

    const target = bb.targetId !== null ? ctx.gameState.objects.get(bb.targetId) : undefined;
    if (target && bb.stance !== 'withdrawing') {
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
    }

    if (bb.destination) {
        locations.push(bb.destination);
    }
    return locations;
}

/** How good would it be to end up at this position/facing, with this evasion active? */
export function positionValue(pos: Position, evasion: number, ctx: EvaluationContext): number {
    const bb = ctx.blackboard;
    let value = 0;

    const target = bb.targetId !== null ? ctx.gameState.objects.get(bb.targetId) : undefined;
    if (target && bb.stance !== 'withdrawing') {
        const targetPos = target.getPosition(ctx.currentTime);
        value += rangeBandScore(distance(pos, targetPos), bb.desiredRange) * 50;

        const arc = bestWeaponArc(ctx.ship.tacticalState.slots);
        if (arc !== null && Math.abs(clampAngle(determineAngle(pos, targetPos) - pos.angle)) <= arc) {
            value += 20;
        }
    } else if (bb.destination) {
        value += Math.max(0, 50 - distance(pos, bb.destination) * 2);
    }

    value += evasion * evasionWeight(bb.stance);
    return value;
}

export function currentEvasion(ctx: EvaluationContext): number {
    return ctx.ship.helmState.activeManeuver?.card?.getParameter('evasion') ?? 0;
}

export function locationCardEvaluator(cardType: CardType): CardEvaluator {
    return (card, ctx) => {
        // While a maneuver runs, replacement goes through the cancel candidate — playing over it
        // would orphan the active card (HelmState.setActiveManeuver overwrites without discarding).
        if (ctx.ship.helmState.activeManeuver) {
            return [];
        }

        const def = getCardDefinition(cardType);
        if (def.targetType !== 'location') {
            return [];
        }

        const cost = card.getParameter('cost');
        const evasion = def.parameters['evasion'] ?? 0;
        const own = ctx.ship.getPosition(ctx.currentTime);
        const currentValue = positionValue(projectCurrentEndpoint(ctx.ship), 0, ctx);

        const out: CandidatePlay[] = [];
        for (const location of generateCandidateLocations(ctx)) {
            const end = estimateManeuverEndpoint(def, own, location);
            if (!end) {
                continue;
            }
            out.push({
                score: positionValue(end, evasion, ctx) - currentValue,
                cost,
                action: { kind: 'playCard', cardId: card.id, cardType, targetType: 'location', targetId: serializeVector(location) },
            });
        }
        return out;
    };
}

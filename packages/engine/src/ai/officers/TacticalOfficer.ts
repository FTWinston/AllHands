import { FiringState } from 'common-data/features/space/types/FiringState';
import { SubTargetInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getFiringSolution } from 'common-data/features/space/utils/getFiringSolution';
import { getFiringState } from 'common-data/features/space/utils/getFiringState';
import { getCardDefinition } from 'src/cards/getEngineCardDefinition';
import { chargeScore } from '../evaluators/tactical';
import { CandidatePlay, EvaluationContext } from '../types';
import { Officer } from './Officer';

export class TacticalOfficer extends Officer {
    readonly role = 'tactical' as const;

    protected override standingCandidates(ctx: EvaluationContext): CandidatePlay[] {
        return [...this.firingCandidates(ctx), ...this.chargeCandidates(ctx)];
    }

    /** Charge a weapon that can't yet fire by spending the hand's least useful weapon or weapon slot card on it. */
    private chargeCandidates(ctx: EvaluationContext): CandidatePlay[] {
        const out: CandidatePlay[] = [];
        const spendable = this.findWorstCard(ctx, (card) => {
            const { targetType } = getCardDefinition(card.type);
            return (targetType === 'weapon' || targetType === 'weapon-slot') && card.getParameter('cost') > 0;
        });
        if (!spendable) {
            return out;
        }

        for (const slot of this.ship.tacticalState.slots) {
            if (slot.canBeCharged() && !slot.hasBeenFullyCharged) {
                out.push({
                    score: chargeScore(slot, ctx),
                    cost: spendable.getParameter('cost'),
                    action: { kind: 'chargeWeaponSlot', cardId: spendable.id, slotId: slot.id },
                });
            }
        }

        return out;
    }

    private firingCandidates(ctx: EvaluationContext): CandidatePlay[] {
        const out: CandidatePlay[] = [];
        const targetId = ctx.blackboard.targetId;
        if (targetId === null || !this.ship.knownObjects.has(targetId)) {
            return out;
        }
        const target = ctx.gameState.objects.get(targetId);
        if (!target) {
            return out;
        }

        const solution = getFiringSolution(this.ship.motion, target.motion, ctx.currentTime);

        for (const slot of this.ship.tacticalState.slots) {
            if (!slot.card) {
                continue;
            }
            for (const subTarget of this.aimPreferences(ctx, targetId)) {
                const firingState = getFiringState(solution, slot.hasBeenFullyCharged, slot.charge, slot.getParameters(), subTarget ?? undefined);
                if (firingState === FiringState.CanFire) {
                    out.push({
                        score: 100,
                        cost: 0, // playWeapon does not check power
                        action: {
                            kind: 'playCard',
                            cardId: slot.card.id,
                            cardType: slot.card.type,
                            targetType: 'enemy',
                            targetId: subTarget ? `${targetId}:${subTarget.id}` : targetId,
                        },
                    });
                    break; // best available aim for this slot
                }
            }
        }
        return out;
    }

    /** Exposed vulnerabilities first, then the commander's focus system, then the bare hull. */
    private aimPreferences(ctx: EvaluationContext, targetId: string): (SubTargetInfo | null)[] {
        const subTargets = this.ship.tacticalState.subTargetsByTarget.get(targetId)?.subTargets ?? [];
        const preferences: (SubTargetInfo | null)[] = [];
        for (const subTarget of subTargets) {
            if (subTarget.id.includes(':')) {
                preferences.push(subTarget); // vulnerability ids are 'system:vulnerabilityId'
            }
        }
        const focus = subTargets.find(st => st.system === ctx.blackboard.focusSystem);
        if (focus && !preferences.includes(focus)) {
            preferences.push(focus);
        }
        preferences.push(null); // plain hull shot
        return preferences;
    }
}

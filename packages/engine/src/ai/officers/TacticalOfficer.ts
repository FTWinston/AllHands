import { FiringState } from 'common-data/features/space/types/FiringState';
import { SubTargetInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getFiringSolution } from 'common-data/features/space/utils/getFiringSolution';
import { getFiringState } from 'common-data/features/space/utils/getFiringState';
import { getCardDefinition } from 'src/cards/getEngineCardDefinition';
import { chargeScore } from '../evaluators/tactical';
import { CandidatePlay, EvaluationContext } from '../types';
import { Officer } from './Officer';
import type { CardParameters } from 'common-data/features/cards/types/CardParameters';
import type { FiringSolution } from 'common-data/features/space/types/FiringSolution';
import type { CardState } from 'src/state/CardState';
import type { WeaponSlotState } from 'src/state/systems/tactical/WeaponSlotState';

/**
 * With every weapon slot loaded and charged, none able to fire at the target, and a weapon in hand that could, the officer waits
 * somewhere between these (game time, in ms, picked by the game's random) before unloading one. The wait starts over if any of that stops holding.
 */
export const UNLOAD_WAIT_MIN_MS = 8_000;
export const UNLOAD_WAIT_MAX_MS = 15_000;
/** Above loading (45) and modifying (40), so that once the wait is over the slot is emptied before anything else is played into it. */
const UNLOAD_SCORE = 50;
/** Just above firing a weapon that does damage (100), so that a weapon that holds the target is fired before the shot it sets up. */
const HOLDING_FIRE_SCORE = 105;

export class TacticalOfficer extends Officer {
    readonly role = 'tactical' as const;

    /** While the officer is waiting to unload a weapon it can't use: the target it can't use it on, and when it'll give up waiting. */
    private stuck: { targetId: string; unloadAt: number } | null = null;

    protected override standingCandidates(ctx: EvaluationContext): CandidatePlay[] {
        return [...this.firingCandidates(ctx), ...this.chargeCandidates(ctx), ...this.unloadCandidates(ctx)];
    }

    /**
     * Unload a weapon that can't fire at the target, so that one in hand that could is loaded instead, once every slot has been full and charged
     * without any of them able to fire for long enough. "Can't fire" is out of range or arc: a weapon that's still charging is left to charge.
     */
    private unloadCandidates(ctx: EvaluationContext): CandidatePlay[] {
        const slot = this.findWeaponToUnload(ctx);
        const targetId = ctx.blackboard.targetId;
        if (!slot || targetId === null) {
            this.stuck = null;
            return [];
        }

        if (this.stuck?.targetId !== targetId) {
            this.stuck = { targetId, unloadAt: ctx.currentTime + ctx.gameState.random.getFloat(UNLOAD_WAIT_MIN_MS, UNLOAD_WAIT_MAX_MS) };
        }

        if (ctx.currentTime < this.stuck.unloadAt) {
            return [];
        }

        return [{ score: UNLOAD_SCORE, cost: 0, action: { kind: 'ejectWeapon', slotId: slot.id } }];
    }

    /**
     * The slot to empty, if every slot holds a charged weapon that can't fire at the target, and the hand holds a weapon that could.
     * Of several, the one furthest from being able to fire. Swapping one weapon for another that can't reach either would be no use.
     */
    private findWeaponToUnload(ctx: EvaluationContext): WeaponSlotState | null {
        const solution = this.getTargetSolution(ctx);
        const slots = this.ship.tacticalState.slots;
        if (!solution || slots.length === 0) {
            return null;
        }

        let furthest: WeaponSlotState | null = null;
        let furthestShortfall = -1;
        for (const slot of slots) {
            // An active weapon keeps its slot busy until it runs down, so wait for that rather than unloading around it.
            if (!slot.card || slot.isActive) {
                return null;
            }

            const state = getFiringState(solution, slot.hasBeenFullyCharged, slot.charge, slot.getParameters());
            if (state === FiringState.NotCharged || (state === FiringState.CanFire && this.wouldFire(ctx, slot))) {
                return null;
            }

            const shortfall = firingShortfall(solution, slot.getParameters());
            if (shortfall > furthestShortfall) {
                furthest = slot;
                furthestShortfall = shortfall;
            }
        }

        return this.hasWeaponThatCouldFire(ctx, solution) ? furthest : null;
    }

    /** Whether the hand holds a weapon that, loaded and charged, could fire at the target from where things are now. */
    private hasWeaponThatCouldFire(ctx: EvaluationContext, solution: FiringSolution): boolean {
        return ctx.system.hand.some((card: CardState) => {
            if (card.isDamaged || getCardDefinition(card.type).targetType !== 'weapon-slot' || card.getParameter('drainPerSecond') > 0) {
                return false;
            }

            const parameters = card.getParameters();
            return getFiringState(solution, true, parameters['totalCharge'] ?? 1, parameters) === FiringState.CanFire;
        });
    }

    private getTargetSolution(ctx: EvaluationContext): FiringSolution | null {
        const targetId = ctx.blackboard.targetId;
        const target = targetId !== null && this.ship.knownObjects.has(targetId) ? ctx.gameState.objects.get(targetId) : undefined;
        return target ? getFiringSolution(this.ship.motion, target.motion, ctx.currentTime) : null;
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
            // A weapon that stays active is fired once and let run down, never kept up with charge.
            if (slot.canBeCharged() && !slot.hasBeenFullyCharged && !slot.staysActive) {
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
        if (!target || target === this.ship || !ctx.gameState.factionRegistry.areHostile(this.ship, target)) {
            return out;
        }

        for (const slot of this.ship.tacticalState.slots) {
            if (!slot.card || slot.isActive || !this.wouldFire(ctx, slot)) {
                continue;
            }
            const subTarget = this.findAim(ctx, slot, targetId);
            if (subTarget !== undefined) {
                out.push({
                    // A weapon that holds its target goes first, so the one it sets up a hit for fires into the hold.
                    score: slot.staysActive ? HOLDING_FIRE_SCORE : 100,
                    cost: 0, // playWeapon does not check power
                    action: {
                        kind: 'playCard',
                        cardId: slot.card.id,
                        cardType: slot.card.type,
                        targetType: 'enemy',
                        targetId: subTarget ? `${targetId}:${subTarget.id}` : targetId,
                    },
                });
            }
        }
        return out;
    }

    /**
     * The best aim a slot's weapon has at the target right now: a sub-target to aim at, null for a plain hull shot, or undefined if it can't fire at it.
     */
    private findAim(ctx: EvaluationContext, slot: WeaponSlotState, targetId: string): SubTargetInfo | null | undefined {
        const target = ctx.gameState.objects.get(targetId);
        if (!target) {
            return undefined;
        }

        const solution = getFiringSolution(this.ship.motion, target.motion, ctx.currentTime);
        for (const subTarget of this.aimPreferences(ctx, targetId)) {
            const aimedFor = this.ship.tacticalState.getAimedFor(slot, targetId);
            if (getFiringState(solution, slot.hasBeenFullyCharged, slot.charge, slot.getParameters(), subTarget ?? undefined, aimedFor) === FiringState.CanFire) {
                return subTarget; // best available aim for this slot
            }
        }
        return undefined;
    }

    /**
     * Whether a loaded weapon is worth firing at the target, if it can. A weapon that stays active holds its target rather than hurting it,
     * so it's only worth it with another weapon, not itself active or held, that can fire at the target too, and with no other of its kind already active.
     */
    private wouldFire(ctx: EvaluationContext, slot: WeaponSlotState): boolean {
        if (!slot.staysActive) {
            return true;
        }

        const targetId = ctx.blackboard.targetId;
        const slots = this.ship.tacticalState.slots;
        if (targetId === null || slots.some(other => other !== slot && other.isActive && other.card?.type === slot.card?.type)) {
            return false;
        }

        return slots.some(other => other !== slot && !!other.card && !other.isActive && !other.staysActive && this.findAim(ctx, other, targetId) !== undefined);
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

/**
 * How far a weapon is from being able to fire at the target: how much too far or too close it is, plus how far round the target would have to come,
 * as the distance along an arc at its range, to be in the weapon's arc.
 */
function firingShortfall(solution: FiringSolution, parameters: CardParameters): number {
    const tooFar = Math.max(0, solution.range - (parameters['maxRange'] ?? 0));
    const tooClose = Math.max(0, (parameters['minRange'] ?? 0) - solution.range);
    const outOfArc = Math.max(0, Math.abs(solution.relativeBearing) - (parameters['firingArc'] ?? 0)) * solution.range;
    return tooFar + tooClose + outOfArc;
}

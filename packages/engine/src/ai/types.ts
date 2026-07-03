import { DeflectorEffectDelivery, DeflectorEffectModifier, DeflectorEffectSubstance } from 'common-data/features/cards/types/CardDefinition';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { AiGoalInfo, AiGoalType, AiShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import type { CardState } from 'src/state/CardState';
import type { GameState } from 'src/state/GameState';
import type { Ship } from 'src/state/Ship';
import type { CrewSystemState } from 'src/state/systems/CrewSystemState';

export type AiRole = 'helm' | 'tactical' | 'science' | 'engineer';
export type AiStance = 'aggressive' | 'evasive' | 'withdrawing' | 'holding';

export interface PowerRequest {
    /** Minimum power level the requesting officer needs. */
    desiredLevel: number;
    /** Game time at which this request lapses; refreshed while the need persists. */
    expires: number;
}

export interface DeflectorCombo {
    modifier: DeflectorEffectModifier | null;
    substance: DeflectorEffectSubstance | null;
    delivery: DeflectorEffectDelivery | null;
}

export interface Blackboard {
    goal: AiGoalType;
    targetId: string | null;
    lastKnownTargetPosition: Vector2D | null;
    stance: AiStance;
    desiredRange: { min: number; max: number };
    destination: Vector2D | null;
    focusSystem: ShipSystem | null;
    /** Deflector combo that would EXPOSE a found vulnerability. Stays null until the engine's vulnerability pipeline is implemented. */
    vulnerabilityPlan: DeflectorCombo | null;
    powerRequests: Map<ShipSystem, PowerRequest>;
}

export type CandidateAction
    = | { kind: 'playCard'; cardId: number; cardType: CardType; targetType: CardTargetType; targetId: string }
        | { kind: 'repair'; system: ShipSystem }
        | { kind: 'cancelManeuver' };

export interface CandidatePlay {
    action: CandidateAction;
    /** 0–100 within-role utility. The officer threshold is the standing value of waiting. */
    score: number;
    /** Resolved power cost this play needs (0 for non-card actions). */
    cost: number;
    /** True if executing would cancel ongoing activity (e.g. an active maneuver); a switching cost is subtracted. */
    interrupts?: boolean;
}

export interface EvaluationContext {
    ship: Ship;
    gameState: GameState;
    blackboard: Blackboard;
    /** The hand/power this officer plays from. */
    system: CrewSystemState;
    currentTime: number;
    config: ResolvedAiConfig;
}

export type CardEvaluator = (card: CardState, ctx: EvaluationContext) => CandidatePlay[];

export interface ResolvedAiConfig {
    goal: AiGoalInfo;
    skill: number;
    fleeThreshold: number;
    priorities: Record<AiRole, number>;
}

export function resolveAiConfig(setup: AiShipSetupInfo): ResolvedAiConfig {
    // Priorities clamp at 0: zero disables the officer (its play threshold becomes Infinity),
    // but a negative value would flip the threshold negative and make every candidate playable.
    const priority = (value: number | undefined) => Math.max(0, value ?? 1);
    return {
        goal: setup.goal,
        skill: Math.max(0, Math.min(1, setup.skill)),
        fleeThreshold: setup.fleeThreshold ?? 0.25,
        priorities: {
            helm: priority(setup.priorities?.helm),
            tactical: priority(setup.priorities?.tactical),
            science: priority(setup.priorities?.science),
            engineer: priority(setup.priorities?.engineer),
        },
    };
}

/** Shared skill-degradation constants (used by both Commander and Officer). */
export const SKILL_NOISE_SCALE = 30;
export const SKILL_SKIP_CHANCE = 0.5;

export function createBlackboard(goal: AiGoalInfo): Blackboard {
    return {
        goal: goal.type,
        targetId: null,
        lastKnownTargetPosition: null,
        stance: 'holding',
        desiredRange: { min: 2, max: 8 },
        destination: null,
        focusSystem: null,
        vulnerabilityPlan: null,
        powerRequests: new Map(),
    };
}

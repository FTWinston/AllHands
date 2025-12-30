import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { AiPersonality } from 'common-data/features/space/types/GameObjectInfo';

// Re-export for convenience
export type { AiPersonality } from 'common-data/features/space/types/GameObjectInfo';

// ============================================================================
// STRATEGIC GOALS & ACTION PLANS
// ============================================================================

/**
 * High-level goals that the command AI can pursue.
 * These represent strategic objectives that require coordination across systems.
 */
export type StrategicGoalType = 'attack-target'
    | 'flee-target'
    | 'patrol-area'
    | 'defend-position'
    | 'repair-critical'
    | 'idle';

/**
 * A strategic goal that the command AI is pursuing.
 */
export interface StrategicGoal {
    type: StrategicGoalType;
    /** The target of this goal, if applicable (e.g., enemy ship ID) */
    targetId?: string;
    /** The priority of this goal (higher = more important) */
    priority: number;
    /** When this goal was created (for aging/timeout) */
    createdAt: number;
}

/**
 * An action plan is a coordinated set of steps to achieve a strategic goal.
 * The plan evolves as systems report their capabilities and constraints.
 */
export interface ActionPlan {
    /** The goal this plan is trying to achieve */
    goal: StrategicGoal;
    /** The current phase of the plan */
    phase: ActionPlanPhase;
    /** Individual steps that need to be executed */
    steps: PlanStep[];
    /** When the plan was last reassessed */
    lastReassessedAt: number;
}

/**
 * Phases of an action plan.
 */
export type ActionPlanPhase = 'preparing'
    | 'executing'
    | 'completed'
    | 'abandoned';

/**
 * A single step in an action plan, assigned to a specific system.
 */
export interface PlanStep {
    /** Which system is responsible for this step */
    system: CrewRoleName;
    /** What type of action this step represents */
    action: PlanStepAction;
    /** Current status of this step */
    status: PlanStepStatus;
    /** When this step can be executed (null = ready now) */
    readyAt: number | null;
    /** The card to play when executing, if known */
    cardId?: number;
    /** Target information for the action */
    target?: AiActionTarget;
    /** Debug description */
    reasoning?: string;
}

export type PlanStepAction = 'approach-target'
    | 'retreat-from-target'
    | 'evasive-maneuvers'
    | 'hold-position'
    | 'fire-weapon'
    | 'equip-weapon'
    | 'scan-target'
    | 'scan-area'
    | 'repair-system'
    | 'boost-system'
    | 'defensive-action';

export type PlanStepStatus = 'pending'
    | 'ready'
    | 'executing'
    | 'completed'
    | 'blocked';

// ============================================================================
// SYSTEM WANTS & CAPABILITIES
// ============================================================================

/**
 * A "want" represents what a system needs from other systems to accomplish its goals.
 * For example, tactical might want to be close to a target to fire weapons.
 */
export interface SystemWant {
    /** Which system has this want */
    system: CrewRoleName;
    /** What the system wants */
    type: WantType;
    /** Priority of this want (higher = more important) */
    priority: number;
    /** Target of the want, if applicable */
    targetId?: string;
    /** Desired value (e.g., desired range) */
    desiredValue?: number;
    /** Debug reasoning */
    reasoning?: string;
}

export type WantType = 'close-range'
    | 'long-range'
    | 'avoid-damage'
    | 'facing-target'
    | 'facing-away'
    | 'energy-reserve'
    | 'time-to-prepare';

/**
 * A capability represents what a system can currently do.
 */
export interface SystemCapability {
    /** Which system has this capability */
    system: CrewRoleName;
    /** What the system can do */
    action: PlanStepAction;
    /** When this capability will be ready (null = ready now) */
    readyAt: number | null;
    /** Cost in energy to use this capability */
    energyCost: number;
    /** The card that would be played */
    cardId: number;
    cardType: CardType;
    /** Target for this capability, if applicable */
    target?: AiActionTarget;
    /** How effective this action would be (0-100) */
    effectiveness: number;
    /** Debug reasoning */
    reasoning?: string;
}

/**
 * A report from a system AI to the command AI about its current state.
 */
export interface SystemReport {
    /** The system making this report */
    system: CrewRoleName;
    /** What this system wants from others */
    wants: SystemWant[];
    /** What this system can currently do */
    capabilities: SystemCapability[];
    /** Current concerns (e.g., "low energy", "damaged") */
    concerns: SystemConcern[];
}

export interface SystemConcern {
    type: ConcernType;
    severity: number; // 0-100, higher = more severe
    reasoning?: string;
}

export type ConcernType = 'low-energy'
    | 'low-health'
    | 'empty-hand'
    | 'under-attack'
    | 'target-escaping'
    | 'overheating';

// ============================================================================
// LEGACY TYPES (kept for compatibility, may be removed later)
// ============================================================================

/**
 * Represents a proposed action from a system AI to the command AI.
 * @deprecated Use SystemCapability instead
 */
export interface AiActionProposal {
    /** The system that owns this card */
    system: CrewRoleName;

    /** The ID of the card to play */
    cardId: number;

    /** The type of the card to play */
    cardType: CardType;

    /** The energy cost of playing this card */
    cost: number;

    /**
     * A score representing how valuable this action is right now.
     * Higher is better. Scale: 0.0 to 100.0
     */
    score: number;

    /** The target required for this card, if any */
    target?: AiActionTarget;

    /** Debug description of why this action is proposed */
    reasoning?: string;
}

export interface AiActionTarget {
    type: CardTargetType;
    id: string;
}

/**
 * Configuration for AI behavior, loaded from scenario data.
 */
export interface AiConfig {
    /** The behavior profile of the AI */
    personality: AiPersonality;

    /** Multiplier for reassessment interval (higher = slower reactions). Default 1.0 */
    reactionMultiplier: number;
}

/**
 * Default AI configuration values.
 */
export const defaultAiConfig: AiConfig = {
    personality: 'balanced',
    reactionMultiplier: 1.0,
};

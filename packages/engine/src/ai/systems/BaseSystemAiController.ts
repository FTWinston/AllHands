import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { cardDefinitions, CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { CrewSystemState } from 'src/state/CrewSystemState';
import { Ship } from '../../state/Ship';
import { SystemState } from '../../state/SystemState';
import {
    ActionPlan,
    AiConfig,
    ConcernType,
    PlanStepAction,
    SystemCapability,
    SystemConcern,
    SystemReport,
    SystemWant,
} from '../types';

/**
 * Base implementation of a system AI controller.
 * Provides common functionality for generating system reports.
 * Subclasses override methods to customize wants and capabilities.
 */
export abstract class BaseSystemAiController {
    abstract readonly role: CrewRoleName;

    generateReport(
        ship: Ship,
        system: CrewSystemState,
        currentPlan: ActionPlan | null,
        config: AiConfig,
        currentTime: number
    ): SystemReport {
        return {
            system: this.role,
            wants: this.generateWants(ship, system, currentPlan, config, currentTime),
            capabilities: this.generateCapabilities(ship, system, currentPlan, config, currentTime),
            concerns: this.generateConcerns(ship, system, currentTime),
        };
    }

    executeAction(
        _ship: Ship,
        _system: SystemState,
        _cardId: number,
        /* TODO: add this parameter! cardType: CardType, */
        _targetType: string,
        _targetId: string
    ): boolean {
        return false;
        /*
        const result = system.playCard(cardId, cardType, targetType as CardTargetType, targetId);
        return result !== null;
        */
    }

    /**
     * Generate the wants for this system.
     * Override in subclasses to specify what the system needs from others.
     */
    protected abstract generateWants(
        ship: Ship,
        system: SystemState,
        currentPlan: ActionPlan | null,
        config: AiConfig,
        currentTime: number
    ): SystemWant[];

    /**
     * Generate the capabilities for this system.
     * Scans the hand for playable cards and evaluates what actions they enable.
     */
    protected generateCapabilities(
        ship: Ship,
        system: CrewSystemState,
        currentPlan: ActionPlan | null,
        config: AiConfig,
        currentTime: number
    ): SystemCapability[] {
        const capabilities: SystemCapability[] = [];

        for (const card of system.hand) {
            const cardType = card.type as CardType;
            const definition = cardDefinitions[cardType];

            // Skip cards that don't belong to this system
            if (definition.crew !== this.role) {
                continue;
            }

            // Evaluate what action this card enables
            const evaluation = this.evaluateCardCapability(
                ship, system, card.id, cardType, currentPlan, config, currentTime
            );

            if (evaluation) {
                capabilities.push({
                    system: this.role,
                    action: evaluation.action,
                    readyAt: system.powerLevel >= definition.cost ? null : currentTime,
                    energyCost: definition.cost,
                    cardId: card.id,
                    cardType,
                    target: evaluation.target,
                    effectiveness: evaluation.effectiveness,
                    reasoning: evaluation.reasoning,
                });
            }
        }

        return capabilities;
    }

    /**
     * Generate concerns about this system's current state.
     */
    protected generateConcerns(
        _ship: Ship,
        system: CrewSystemState,
        _currentTime: number
    ): SystemConcern[] {
        const concerns: SystemConcern[] = [];

        // Check health
        const healthRatio = system.health / Math.max(system.maxHealth, 1);
        if (healthRatio < 0.5) {
            concerns.push({
                type: 'low-health' as ConcernType,
                severity: (1 - healthRatio) * 100,
                reasoning: `Health at ${Math.round(healthRatio * 100)}%`,
            });
        }

        // Check hand size
        if (system.hand.length === 0) {
            concerns.push({
                type: 'empty-hand' as ConcernType,
                severity: 100,
                reasoning: 'No cards in hand',
            });
        }

        return concerns;
    }

    /**
     * Evaluate what action a specific card enables.
     * Override in subclasses to map cards to plan step actions.
     */
    protected abstract evaluateCardCapability(
        ship: Ship,
        system: SystemState,
        cardId: number,
        cardType: CardType,
        currentPlan: ActionPlan | null,
        config: AiConfig,
        currentTime: number
    ): {
        action: PlanStepAction;
        target?: { type: CardTargetType; id: string };
        effectiveness: number;
        reasoning?: string;
    } | null;

    /**
     * Estimate when we'll be ready to play a card requiring the given power.
     * Since power doesn't regenerate, this is essentially immediate if we have enough power.
     */
    protected estimatePowerReadyTime(
        system: SystemState,
        requiredPower: number,
        currentTime: number
    ): number {
        // If we don't have enough power, we can't play the card
        if (system.powerLevel < requiredPower) {
            return Infinity;
        }
        return currentTime;
    }
}

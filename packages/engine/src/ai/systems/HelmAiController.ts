import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { cardDefinitions, CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { Ship } from '../../state/Ship';
import { SystemState } from '../../state/SystemState';
import { ActionPlan, AiConfig, PlanStepAction, SystemWant } from '../types';
import { BaseSystemAiController } from './BaseSystemAiController';

/**
 * AI controller for the Helm system.
 * Responsible for navigation and movement cards.
 *
 * The Helm system's primary concerns are:
 * - Positioning the ship relative to targets (approach/retreat)
 * - Evasive maneuvers when under threat
 * - Patrol and navigation waypoints
 */
export class HelmAiController extends BaseSystemAiController {
    readonly role: CrewRoleName = 'helm';

    protected generateWants(
        _ship: Ship,
        _system: SystemState,
        currentPlan: ActionPlan | null,
        _config: AiConfig,
        _currentTime: number
    ): SystemWant[] {
        const wants: SystemWant[] = [];

        // Helm doesn't typically "want" things from other systems,
        // but it might want sensor data about targets
        if (currentPlan?.goal.type === 'attack-target' && currentPlan.goal.targetId) {
            // We need to know where the target is to approach it
            wants.push({
                system: this.role,
                type: 'facing-target',
                priority: 40,
                targetId: currentPlan.goal.targetId,
                reasoning: 'Need to face target for approach',
            });
        }

        return wants;
    }

    protected evaluateCardCapability(
        ship: Ship,
        _system: SystemState,
        _cardId: number,
        cardType: CardType,
        currentPlan: ActionPlan | null,
        config: AiConfig,
        _currentTime: number
    ): {
        action: PlanStepAction;
        target?: { type: CardTargetType; id: string };
        effectiveness: number;
        reasoning?: string;
    } | null {
        const definition = cardDefinitions[cardType];

        if (definition.targetType === 'location') {
            // Movement cards - determine what kind of movement based on current plan
            if (currentPlan?.goal.type === 'attack-target' && currentPlan.goal.targetId) {
                return {
                    action: 'approach-target',
                    target: { type: 'location', id: currentPlan.goal.targetId },
                    effectiveness: 70,
                    reasoning: 'Move toward attack target',
                };
            } else if (currentPlan?.goal.type === 'flee-target' && currentPlan.goal.targetId) {
                return {
                    action: 'retreat-from-target',
                    target: { type: 'location', id: currentPlan.goal.targetId },
                    effectiveness: 70,
                    reasoning: 'Move away from threat',
                };
            } else if (currentPlan?.goal.type === 'patrol-area') {
                return {
                    action: 'approach-target',
                    target: { type: 'location', id: this.findPatrolWaypoint(ship, config) },
                    effectiveness: 50,
                    reasoning: 'Continue patrol route',
                };
            }
        } else if (definition.targetType === 'no-target') {
            // Untargeted helm cards are typically evasive maneuvers
            return {
                action: 'evasive-maneuvers',
                effectiveness: this.calculateEvasiveEffectiveness(config),
                reasoning: 'Evasive maneuvers to avoid damage',
            };
        }

        return null;
    }

    private findPatrolWaypoint(_ship: Ship, _config: AiConfig): string {
        // TODO: Get next patrol waypoint from ship's patrol route
        return 'patrol-0';
    }

    private calculateEvasiveEffectiveness(config: AiConfig): number {
        if (config.personality === 'defensive') {
            return 80;
        }
        return 50;
    }
}

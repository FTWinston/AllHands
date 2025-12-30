import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { cardDefinitions, CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { Ship } from '../../state/Ship';
import { SystemState } from '../../state/SystemState';
import { ActionPlan, AiConfig, PlanStepAction, SystemWant } from '../types';
import { BaseSystemAiController } from './BaseSystemAiController';

/**
 * AI controller for the Sensors system.
 * Responsible for scanning, detection, and information gathering.
 *
 * The Sensors system's primary concerns are:
 * - Keeping track of enemy positions and status
 * - Providing targeting data to other systems
 * - Early warning of threats
 */
export class SensorsAiController extends BaseSystemAiController {
    readonly role: CrewRoleName = 'sensors';

    protected generateWants(
        _ship: Ship,
        _system: SystemState,
        currentPlan: ActionPlan | null,
        config: AiConfig,
        _currentTime: number
    ): SystemWant[] {
        const wants: SystemWant[] = [];

        // Sensors generally want time to scan and gather information
        if (config.personality === 'patrol' || config.personality === 'defensive') {
            wants.push({
                system: this.role,
                type: 'time-to-prepare',
                priority: 30,
                desiredValue: 5000, // 5 seconds to scan
                reasoning: 'Need time to perform thorough scans',
            });
        }

        // If we're attacking, we want to be able to scan the target
        if (currentPlan?.goal.type === 'attack-target' && currentPlan.goal.targetId) {
            wants.push({
                system: this.role,
                type: 'facing-target',
                priority: 35,
                targetId: currentPlan.goal.targetId,
                reasoning: 'Need line of sight to target for detailed scan',
            });
        }

        return wants;
    }

    protected evaluateCardCapability(
        _ship: Ship,
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

        if (definition.targetType === 'no-target') {
            // Area scan cards
            return {
                action: 'scan-area',
                effectiveness: this.calculateScanEffectiveness(config),
                reasoning: 'Area scan for situational awareness',
            };
        } else if (definition.targetType === 'enemy') {
            // Targeted scan cards
            const targetId = currentPlan?.goal.targetId ?? this.findBestScanTarget();
            if (targetId) {
                return {
                    action: 'scan-target',
                    target: { type: 'enemy', id: targetId },
                    effectiveness: 75,
                    reasoning: 'Detailed scan of priority target',
                };
            }
        }

        return null;
    }

    private calculateScanEffectiveness(config: AiConfig): number {
        if (config.personality === 'patrol') {
            return 80;
        } else if (config.personality === 'defensive') {
            return 70;
        }
        return 50;
    }

    private findBestScanTarget(): string | null {
        // TODO: Find unscanned or highest-priority targets
        return null;
    }
}

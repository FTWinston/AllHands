import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { cardDefinitions, CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { Ship } from '../../state/Ship';
import { SystemState } from '../../state/SystemState';
import { ActionPlan, AiConfig, PlanStepAction, SystemWant } from '../types';
import { BaseSystemAiController } from './BaseSystemAiController';

/**
 * AI controller for the Engineer system.
 * Responsible for repairs, power management, and system maintenance.
 *
 * The Engineer system's primary concerns are:
 * - Keeping systems repaired and operational
 * - Managing power distribution
 * - Defensive measures (smoke screens, etc.)
 * - Avoiding further damage when already damaged
 */
export class EngineerAiController extends BaseSystemAiController {
    readonly role: CrewRoleName = 'engineer';

    protected generateWants(
        ship: Ship,
        _system: SystemState,
        currentPlan: ActionPlan | null,
        config: AiConfig,
        _currentTime: number
    ): SystemWant[] {
        const wants: SystemWant[] = [];

        // Check overall ship health
        const overallHealth = this.calculateOverallHealth(ship);

        // If we're damaged, we want to avoid taking more damage
        if (overallHealth < 0.7) {
            const severity = (1 - overallHealth) * 100;

            wants.push({
                system: this.role,
                type: 'avoid-damage',
                priority: severity, // Higher priority when more damaged
                reasoning: `Ship at ${Math.round(overallHealth * 100)}% health, need to avoid damage`,
            });

            // If very damaged and we're attacking, suggest retreating
            if (overallHealth < 0.4 && currentPlan?.goal.type === 'attack-target') {
                wants.push({
                    system: this.role,
                    type: 'long-range',
                    priority: 80,
                    targetId: currentPlan.goal.targetId,
                    reasoning: 'Critical damage - need distance to repair',
                });
            }
        }

        // If we're in combat, we might want time to repair
        if (currentPlan?.goal.type === 'attack-target' && overallHealth < 0.8) {
            wants.push({
                system: this.role,
                type: 'time-to-prepare',
                priority: 50,
                desiredValue: 10000, // 10 seconds to repair
                reasoning: 'Need time to perform repairs before engaging',
            });
        }

        // Defensive personality always wants to preserve energy
        if (config.personality === 'defensive') {
            wants.push({
                system: this.role,
                type: 'energy-reserve',
                priority: 40,
                desiredValue: 0.5, // Keep 50% energy in reserve
                reasoning: 'Maintaining energy reserves for emergencies',
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

        if (definition.targetType === 'system') {
            // Repair or boost cards
            const targetSystem = this.findSystemToRepair(ship);
            if (targetSystem !== null) {
                const overallHealth = this.calculateOverallHealth(ship);
                return {
                    action: 'repair-system',
                    target: { type: 'system', id: String(targetSystem) },
                    effectiveness: this.calculateRepairEffectiveness(overallHealth, config),
                    reasoning: `Repair system ${targetSystem}`,
                };
            }

            // If nothing needs repair, might be a boost card
            const boostTarget = this.findSystemToBoost(ship, currentPlan);
            if (boostTarget !== null) {
                return {
                    action: 'boost-system',
                    target: { type: 'system', id: String(boostTarget) },
                    effectiveness: 50,
                    reasoning: `Boost system ${boostTarget}`,
                };
            }
        } else if (definition.targetType === 'no-target') {
            // Defensive utility cards (smoke screen, etc.)
            return {
                action: 'defensive-action',
                effectiveness: this.calculateDefensiveEffectiveness(ship, config),
                reasoning: 'Deploy defensive countermeasure',
            };
        }

        return null;
    }

    private calculateOverallHealth(ship: Ship): number {
        const systems = [
            ship.helmState,
            ship.sensorState,
            ship.tacticalState,
            ship.engineerState,
        ];

        let totalHealth = 0;
        let totalMaxHealth = 0;

        for (const sys of systems) {
            totalHealth += sys.health;
            totalMaxHealth += sys.powerLevel; // Assuming powerLevel is max health
        }

        return totalMaxHealth > 0 ? totalHealth / totalMaxHealth : 1;
    }

    private findSystemToRepair(ship: Ship): number | null {
        const systems = [
            { index: 0, state: ship.helmState },
            { index: 1, state: ship.sensorState },
            { index: 2, state: ship.tacticalState },
            { index: 3, state: ship.engineerState },
        ];

        let mostDamaged: { index: number; healthRatio: number } | null = null;

        for (const sys of systems) {
            const healthRatio = sys.state.health / Math.max(sys.state.powerLevel, 1);
            if (healthRatio < 1) {
                if (!mostDamaged || healthRatio < mostDamaged.healthRatio) {
                    mostDamaged = { index: sys.index, healthRatio };
                }
            }
        }

        return mostDamaged?.index ?? null;
    }

    private findSystemToBoost(_ship: Ship, currentPlan: ActionPlan | null): number | null {
        // If attacking, boost tactical
        if (currentPlan?.goal.type === 'attack-target') {
            return 2; // Tactical index
        }
        // If fleeing or patrolling, boost helm
        if (currentPlan?.goal.type === 'flee-target' || currentPlan?.goal.type === 'patrol-area') {
            return 0; // Helm index
        }
        return null;
    }

    private calculateRepairEffectiveness(overallHealth: number, config: AiConfig): number {
        // More effective when damaged and defensive
        const baseEffectiveness = (1 - overallHealth) * 100;
        if (config.personality === 'defensive') {
            return Math.min(100, baseEffectiveness + 20);
        }
        return baseEffectiveness;
    }

    private calculateDefensiveEffectiveness(ship: Ship, config: AiConfig): number {
        const overallHealth = this.calculateOverallHealth(ship);

        if (config.personality === 'defensive') {
            return 70;
        }

        // More effective when damaged
        if (overallHealth < 0.5) {
            return 80;
        }

        return 40;
    }
}

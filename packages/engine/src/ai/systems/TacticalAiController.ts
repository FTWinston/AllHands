import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { cardDefinitions, CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { Ship } from '../../state/Ship';
import { SystemState } from '../../state/SystemState';
import { ActionPlan, AiConfig, PlanStepAction, SystemWant } from '../types';
import { BaseSystemAiController } from './BaseSystemAiController';

/**
 * AI controller for the Tactical system.
 * Responsible for weapons, targeting, and combat actions.
 *
 * The Tactical system's primary concerns are:
 * - Getting into weapons range of targets
 * - Having weapons equipped and ready to fire
 * - Coordinating fire timing with ship positioning
 */
export class TacticalAiController extends BaseSystemAiController {
    readonly role: CrewRoleName = 'tactical';

    protected generateWants(
        _ship: Ship,
        system: SystemState,
        currentPlan: ActionPlan | null,
        config: AiConfig,
        _currentTime: number
    ): SystemWant[] {
        const wants: SystemWant[] = [];

        // If we're attacking, we want to be close to the target
        if (currentPlan?.goal.type === 'attack-target' && currentPlan.goal.targetId) {
            // Check if we have short-range weapons ready
            const hasShortRangeWeapons = this.hasWeaponsOfType(system, 'short');

            if (hasShortRangeWeapons) {
                wants.push({
                    system: this.role,
                    type: 'close-range',
                    priority: 70,
                    targetId: currentPlan.goal.targetId,
                    desiredValue: 3, // Desired range units
                    reasoning: 'Need close range for short-range weapons',
                });
            } else {
                wants.push({
                    system: this.role,
                    type: 'long-range',
                    priority: 50,
                    targetId: currentPlan.goal.targetId,
                    desiredValue: 10,
                    reasoning: 'Prefer long range for safety while attacking',
                });
            }

            // We want to be facing the target to fire
            wants.push({
                system: this.role,
                type: 'facing-target',
                priority: 80,
                targetId: currentPlan.goal.targetId,
                reasoning: 'Must face target to fire weapons',
            });
        }

        // If personality is aggressive, always want to find and engage targets
        if (config.personality === 'aggressive' && !currentPlan) {
            wants.push({
                system: this.role,
                type: 'close-range',
                priority: 40,
                reasoning: 'Looking for targets to engage',
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

        if (definition.targetType === 'weapon-slot') {
            // Weapon equip cards
            const slot = this.findAvailableWeaponSlot(ship);
            if (slot !== null) {
                return {
                    action: 'equip-weapon',
                    target: { type: 'weapon-slot', id: String(slot) },
                    effectiveness: this.calculateWeaponEquipEffectiveness(config),
                    reasoning: `Equip weapon to slot ${slot}`,
                };
            }
        } else if (definition.targetType === 'enemy') {
            // Direct attack cards
            const targetId = currentPlan?.goal.targetId ?? this.findPriorityTarget(ship);
            if (targetId) {
                return {
                    action: 'fire-weapon',
                    target: { type: 'enemy', id: targetId },
                    effectiveness: this.calculateAttackEffectiveness(config),
                    reasoning: 'Fire at priority target',
                };
            }
        } else if (definition.targetType === 'no-target') {
            // Utility tactical cards (flares, etc.)
            return {
                action: 'defensive-action',
                effectiveness: 40,
                reasoning: 'Tactical utility action',
            };
        }

        return null;
    }

    private hasWeaponsOfType(_system: SystemState, _type: 'short' | 'long'): boolean {
        // TODO: Check equipped weapons for range type
        return true; // Assume short range for now
    }

    private findAvailableWeaponSlot(_ship: Ship): number | null {
        // TODO: Check ship's weapon slots for availability
        return 0;
    }

    private findPriorityTarget(_ship: Ship): string | null {
        // TODO: Find highest-priority enemy target
        return null;
    }

    private calculateWeaponEquipEffectiveness(config: AiConfig): number {
        if (config.personality === 'aggressive') {
            return 80;
        }
        return 60;
    }

    private calculateAttackEffectiveness(config: AiConfig): number {
        if (config.personality === 'aggressive') {
            return 90;
        } else if (config.personality === 'defensive') {
            return 50;
        }
        return 70;
    }
}

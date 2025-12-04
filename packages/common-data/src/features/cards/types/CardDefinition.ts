import { CrewRoleName } from '../../ships/types/CrewRole';
import { CardTargetType } from './CardTargetType';

interface CommonCardDefinition {
    targetType: CardTargetType;
    crew: CrewRoleName;
    cost: number;
}

export type NoTargetCardDefinition = CommonCardDefinition & {
    targetType: 'no-target';
};

export type WeaponSlotTargetCardDefinition = CommonCardDefinition & {
    targetType: 'weapon-slot';
    canPlay?: () => boolean;
};

export type WeaponTargetCardDefinition = CommonCardDefinition & {
    targetType: 'weapon';
    canPlay?: () => boolean;
};

export type EnemyTargetCardDefinition = CommonCardDefinition & {
    targetType: 'enemy';
    canPlay?: () => boolean;
};

export type SystemTargetCardDefinition = CommonCardDefinition & {
    targetType: 'system';
    canPlay?: () => boolean;
};

export type LocationTargetCardDefinition = CommonCardDefinition & {
    targetType: 'location';
    canPlay?: () => boolean;
};

export type CardDefinition = NoTargetCardDefinition | WeaponSlotTargetCardDefinition | WeaponTargetCardDefinition | EnemyTargetCardDefinition | SystemTargetCardDefinition | LocationTargetCardDefinition;

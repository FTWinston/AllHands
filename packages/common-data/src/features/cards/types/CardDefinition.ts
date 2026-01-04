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
};

export type WeaponTargetCardDefinition = CommonCardDefinition & {
    targetType: 'weapon';
};

export type EnemyTargetCardDefinition = CommonCardDefinition & {
    targetType: 'enemy';
};

export type SystemTargetCardDefinition = CommonCardDefinition & {
    targetType: 'system';
};

export type LocationTargetCardDefinition = CommonCardDefinition & {
    targetType: 'location';
    motionData: CardMotionDataPoint[];
};

export type CardMotionDataPoint = {
    face?: 'nextVector' | 'previousVector' | 'finalVector';
    baseSpeed: number;
};

export type CardDefinition = NoTargetCardDefinition | WeaponSlotTargetCardDefinition | WeaponTargetCardDefinition | EnemyTargetCardDefinition | SystemTargetCardDefinition | LocationTargetCardDefinition;

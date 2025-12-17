import { EnemyTargetCardDefinition, LocationTargetCardDefinition, NoTargetCardDefinition, SystemTargetCardDefinition, WeaponSlotTargetCardDefinition, WeaponTargetCardDefinition } from 'common-data/features/cards/types/CardDefinition';

export type NoTargetCardFunctionality = {
    play: () => boolean;
};

export type WeaponSlotTargetCardFunctionality = {
    play: (slot: number) => boolean;
};

export type WeaponTargetCardFunctionality = {
    play: (weapon: number) => boolean;
};

export type EnemyTargetCardFunctionality = {
    play: (targetId: string) => boolean;
};

export type SystemTargetCardFunctionality = {
    play: (system: number) => boolean;
};

export type LocationTargetCardFunctionality = {
    play: (locations: number[]) => boolean;
};

export type EngineCardFunctionality = NoTargetCardFunctionality
    | WeaponSlotTargetCardFunctionality
    | WeaponTargetCardFunctionality
    | SystemTargetCardFunctionality
    | EnemyTargetCardFunctionality
    | LocationTargetCardFunctionality;

export type EngineNoTargetCardDefinition = NoTargetCardFunctionality & NoTargetCardDefinition;

export type EngineWeaponSlotCardDefinition = WeaponSlotTargetCardFunctionality & WeaponSlotTargetCardDefinition;

export type EngineWeaponTargetCardDefinition = WeaponTargetCardFunctionality & WeaponTargetCardDefinition;

export type EngineEnemyTargetCardDefinition = EnemyTargetCardFunctionality & EnemyTargetCardDefinition;

export type EngineSystemTargetCardDefinition = SystemTargetCardFunctionality & SystemTargetCardDefinition;

export type EngineLocationTargetCardDefinition = LocationTargetCardFunctionality & LocationTargetCardDefinition;

export type EngineCardDefinition = EngineNoTargetCardDefinition
    | EngineWeaponSlotCardDefinition
    | EngineWeaponTargetCardDefinition
    | EngineEnemyTargetCardDefinition
    | EngineSystemTargetCardDefinition
    | EngineLocationTargetCardDefinition;

export type EngineCardInstance = EngineCardDefinition & {
    id: number;
};

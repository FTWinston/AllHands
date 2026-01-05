import { CardMotionSegment, EnemyTargetCardDefinition, LocationTargetCardDefinition, NoTargetCardDefinition, SystemTargetCardDefinition, WeaponSlotTargetCardDefinition, WeaponTargetCardDefinition } from 'common-data/features/cards/types/CardDefinition';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { GameState } from 'src/state/GameState';
import { Ship } from 'src/state/Ship';

export type NoTargetCardFunctionality = {
    play: (gameState: GameState, ship: Ship) => boolean;
};

export type WeaponSlotTargetCardFunctionality = {
    play: (gameState: GameState, ship: Ship, slot: number) => boolean;
};

export type WeaponTargetCardFunctionality = {
    play: (gameState: GameState, ship: Ship, weapon: number) => boolean;
};

export type EnemyTargetCardFunctionality = {
    play: (gameState: GameState, ship: Ship, targetId: string) => boolean;
};

export type SystemTargetCardFunctionality = {
    play: (gameState: GameState, ship: Ship, system: number) => boolean;
};

export type LocationTargetCardFunctionality = {
    play: (gameState: GameState, ship: Ship, motionData: CardMotionSegment[], locations: Vector2D[]) => boolean;
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

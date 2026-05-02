import { ChoiceCardDefinition, EnemyTargetCardDefinition, LocationTargetCardDefinition, NoTargetCardDefinition, SystemTargetCardDefinition, WeaponSlotTargetCardDefinition, WeaponTargetCardDefinition } from 'common-data/features/cards/types/CardDefinition';
import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { EngineerSystemTile } from 'src/state/EngineerSystemTile';
import { GameObject } from 'src/state/GameObject';
import { GameState } from 'src/state/GameState';
import { Ship } from 'src/state/Ship';
import { WeaponSlotState } from 'src/state/WeaponSlotState';

export type NoTargetCardFunctionality = {
    play: (gameState: GameState, ship: Ship, parameters: CardParameters) => boolean;
};

export type ChoiceTargetCardFunctionality = object;

export type WeaponSlotTargetCardFunctionality = {
    load: (gameState: GameState, ship: Ship, slot: WeaponSlotState, parameters: CardParameters) => boolean;
    fire: (gameState: GameState, ship: Ship, target: GameObject, parameters: CardParameters) => boolean;
};

export type WeaponTargetCardFunctionality = {
    prime: (gameState: GameState, ship: Ship, slot: WeaponSlotState, parameters: CardParameters) => boolean;
    charge: (gameState: GameState, ship: Ship, slot: WeaponSlotState, parameters: CardParameters) => boolean;
};

export type EnemyTargetCardFunctionality = {
    play: (gameState: GameState, ship: Ship, target: GameObject, parameters: CardParameters) => boolean;
};

export type SystemTargetCardFunctionality = {
    play: (gameState: GameState, ship: Ship, system: EngineerSystemTile, parameters: CardParameters) => boolean;
};

export type LocationTargetCardFunctionality = {
    play: (gameState: GameState, ship: Ship, cardPower: number, cardDefinition: LocationTargetCardDefinition, location: Vector2D, parameters: CardParameters) => boolean;
};

export type EngineCardFunctionality = NoTargetCardFunctionality
    | ChoiceTargetCardFunctionality
    | WeaponSlotTargetCardFunctionality
    | WeaponTargetCardFunctionality
    | SystemTargetCardFunctionality
    | EnemyTargetCardFunctionality
    | LocationTargetCardFunctionality;

export type EngineNoTargetCardDefinition = NoTargetCardFunctionality & NoTargetCardDefinition;

export type EngineChoiceTargetCardDefinition = ChoiceTargetCardFunctionality & ChoiceCardDefinition;

export type EngineWeaponSlotCardDefinition = WeaponSlotTargetCardFunctionality & WeaponSlotTargetCardDefinition;

export type EngineWeaponTargetCardDefinition = WeaponTargetCardFunctionality & WeaponTargetCardDefinition;

export type EngineEnemyTargetCardDefinition = EnemyTargetCardFunctionality & EnemyTargetCardDefinition;

export type EngineSystemTargetCardDefinition = SystemTargetCardFunctionality & SystemTargetCardDefinition;

export type EngineLocationTargetCardDefinition = LocationTargetCardFunctionality & LocationTargetCardDefinition;

export type EngineCardDefinition = EngineNoTargetCardDefinition
    | EngineChoiceTargetCardDefinition
    | EngineWeaponSlotCardDefinition
    | EngineWeaponTargetCardDefinition
    | EngineEnemyTargetCardDefinition
    | EngineSystemTargetCardDefinition
    | EngineLocationTargetCardDefinition;

export type EngineCardInstance = EngineCardDefinition & {
    id: number;
};

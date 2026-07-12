import { ChoiceCardDefinition, DeflectorTargetCardDefinition, EnemyTargetCardDefinition, LocationTargetCardDefinition, NoTargetCardDefinition, SystemTargetCardDefinition, WeaponSlotTargetCardDefinition, WeaponTargetCardDefinition } from 'common-data/features/cards/types/CardDefinition';
import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { WeaponTrait } from 'common-data/features/cards/types/CardTrait';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { CardState } from 'src/state/CardState';
import { GameObject } from 'src/state/GameObject';
import { GameState } from 'src/state/GameState';
import { Ship } from 'src/state/Ship';
import { EngineerSystemTile } from 'src/state/systems/engineer/EngineerSystemTile';
import { WeaponSlotState } from 'src/state/systems/tactical/WeaponSlotState';
import type { CardEvaluator } from 'src/ai/types';

/**
 * This type just adds the optional `aiEvaluator` slot to each card functionality shape below.
 * The actual card entries — each pairing an `aiEvaluator` with the play functions it must mirror —
 * are co-located in getEngineCardDefinition.ts, so the two can't drift apart. Cards without one are
 * never played by the AI (see warnMissingEvaluator in src/ai/evaluators/index.ts).
 */
export type EngineCardAiFunctionality = {
    aiEvaluator?: CardEvaluator;
};

export type NoTargetCardFunctionality = EngineCardAiFunctionality & {
    play: (gameState: GameState, ship: Ship, parameters: CardParameters) => boolean;
};

export type ChoiceTargetCardFunctionality = EngineCardAiFunctionality;

export type WeaponSlotTargetCardFunctionality = EngineCardAiFunctionality & {
    load: (gameState: GameState, ship: Ship, slot: WeaponSlotState, parameters: CardParameters) => boolean;
    fire: (gameState: GameState, ship: Ship, target: GameObject, parameters: CardParameters, accuracy: number, weaponTraits: WeaponTrait[]) => boolean;
};

export type WeaponTargetCardFunctionality = EngineCardAiFunctionality & {
    prime: (gameState: GameState, ship: Ship, slot: WeaponSlotState, parameters: CardParameters) => boolean;
    charge: (gameState: GameState, ship: Ship, slot: WeaponSlotState, parameters: CardParameters) => boolean;
};

export type EnemyTargetCardFunctionality = EngineCardAiFunctionality & {
    play: (gameState: GameState, ship: Ship, target: GameObject | null, targetSystem: ShipSystem | null, parameters: CardParameters) => boolean;
};

export type DeflectorTargetCardFunctionality = EngineCardAiFunctionality & {
    load: (gameState: GameState, ship: Ship, slotId: string, parameters: CardParameters) => boolean;
    play: (gameState: GameState, ship: Ship, target: GameObject | null, targetSystem: ShipSystem | null, parameters: CardParameters) => boolean;
};

export type SystemTargetCardFunctionality = EngineCardAiFunctionality & {
    play: (gameState: GameState, ship: Ship, system: EngineerSystemTile, parameters: CardParameters) => boolean;
};

export type LocationTargetCardFunctionality = EngineCardAiFunctionality & {
    play: (gameState: GameState, ship: Ship, cardInstance: CardState, cardDefinition: LocationTargetCardDefinition, location: Vector2D, parameters: CardParameters) => boolean;
};

export type EngineCardFunctionality = NoTargetCardFunctionality
    | ChoiceTargetCardFunctionality
    | WeaponSlotTargetCardFunctionality
    | WeaponTargetCardFunctionality
    | SystemTargetCardFunctionality
    | EnemyTargetCardFunctionality
    | DeflectorTargetCardFunctionality
    | LocationTargetCardFunctionality;

export type EngineNoTargetCardDefinition = NoTargetCardFunctionality & NoTargetCardDefinition;

export type EngineChoiceTargetCardDefinition = ChoiceTargetCardFunctionality & ChoiceCardDefinition;

export type EngineWeaponSlotCardDefinition = WeaponSlotTargetCardFunctionality & WeaponSlotTargetCardDefinition;

export type EngineWeaponTargetCardDefinition = WeaponTargetCardFunctionality & WeaponTargetCardDefinition;

export type EngineEnemyTargetCardDefinition = EnemyTargetCardFunctionality & EnemyTargetCardDefinition;

export type EngineDeflectorTargetCardDefinition = DeflectorTargetCardFunctionality & DeflectorTargetCardDefinition;

export type EngineSystemTargetCardDefinition = SystemTargetCardFunctionality & SystemTargetCardDefinition;

export type EngineLocationTargetCardDefinition = LocationTargetCardFunctionality & LocationTargetCardDefinition;

export type EngineCardDefinition = EngineNoTargetCardDefinition
    | EngineChoiceTargetCardDefinition
    | EngineWeaponSlotCardDefinition
    | EngineWeaponTargetCardDefinition
    | EngineEnemyTargetCardDefinition
    | EngineDeflectorTargetCardDefinition
    | EngineSystemTargetCardDefinition
    | EngineLocationTargetCardDefinition;

export type EngineCardInstance = EngineCardDefinition & {
    id: number;
};

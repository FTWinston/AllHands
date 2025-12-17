import { CardInstance } from 'src/features/cards/types/CardInstance';
import { CardType } from 'src/features/cards/utils/cardDefinitions';
import { Cooldown } from 'src/types/Cooldown';
import { MinimalReadonlyArray } from 'src/types/MinimalArray';
import { ReadonlyKeyframes } from './Keyframes';
import { ObjectAppearance } from './ObjectAppearance';
import { Position } from './Position';
import { RelationshipType } from './RelationshipType';

export type ObjectId = string;

export interface GameObjectInfo {
    id: ObjectId;
    appearance: ObjectAppearance;
    relationship: RelationshipType;
    motion: ReadonlyKeyframes<Position>;
}

export type SystemPowerPriority = typeof handPriority | typeof powerPriority;

export const handPriority = 1;
export const powerPriority = 2;

export interface SystemInfo {
    hand: MinimalReadonlyArray<CardInstance>;
    energy: number;
    powerLevel: number;
    health: number;
    priority: SystemPowerPriority;
    cardGeneration: MinimalReadonlyArray<Cooldown>;
    powerGeneration: MinimalReadonlyArray<Cooldown>;
}

export interface ShipInfo extends GameObjectInfo {
    helmState: SystemInfo;
    sensorState: SystemInfo;
    tacticalState: SystemInfo;
    engineerState: SystemInfo;
}

export interface SystemSetupInfo {
    cards: CardType[];
    energy: number;
    powerLevel: number;
    initialHandSize: number;
    health: number;
}

export interface ShipSetupInfo {
    position: Position;
    helm: SystemSetupInfo;
    sensors: SystemSetupInfo;
    tactical: SystemSetupInfo;
    engineer: SystemSetupInfo;
}

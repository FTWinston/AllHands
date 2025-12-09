import { CardInstance } from 'src/features/cards/types/CardInstance';
import { MinimalArray } from 'src/types/MinimalArray';
import { Keyframes } from './Keyframes';
import { ObjectAppearance } from './ObjectAppearance';
import { Position } from './Position';
import { RelationshipType } from './RelationshipType';

export type ObjectId = string;

export interface GameObjectInfo {
    id: ObjectId;
    appearance: ObjectAppearance;
    relationship: RelationshipType;
    motion: Keyframes<Position>;
}

export interface SystemInfo {
    hand: MinimalArray<CardInstance>;
    energy: number;
    powerLevel: number;
    health: number;
}

export interface ShipInfo extends GameObjectInfo {
    helmState: SystemInfo;
    sensorState: SystemInfo;
    tacticalState: SystemInfo;
    engineerState: SystemInfo;
}

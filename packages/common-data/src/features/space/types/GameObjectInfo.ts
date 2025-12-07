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

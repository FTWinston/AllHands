import { Keyframes } from './Keyframes';
import { ObjectAppearance } from './ObjectAppearance';
import { Position } from './Position';
import { RelationshipType } from './RelationshipType';

export type ObjectId = number;

export interface GameObjectInfo {
    id: ObjectId;
    draw: ObjectAppearance;
    relationship: RelationshipType;
    motion: Keyframes<Position>;
}

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

export interface SystemInfo {
    hand: MinimalReadonlyArray<CardInstance>;
    powerLevel: number;
    health: number;
    cardGeneration: MinimalReadonlyArray<Cooldown>;
}

export interface ShipInfo extends GameObjectInfo {
    helmState: SystemInfo;
    sensorState: SystemInfo;
    tacticalState: SystemInfo;
    engineerState: SystemInfo;
}

export interface SystemSetupInfo {
    cards: CardType[];
    initialPowerLevel: number;
    maxPowerLevel: number;
    initialHandSize: number;
    health: number;
    maxHealth: number;
}

export interface GameObjectSetupInfo {
    appearance: ObjectAppearance;
    relationship: RelationshipType;
}

export interface ShipSetupInfo extends GameObjectSetupInfo {
    position: Position;
    helm: SystemSetupInfo;
    sensors: SystemSetupInfo;
    tactical: SystemSetupInfo;
    engineer: SystemSetupInfo;
}

export type PlayerShipSetupInfo = Omit<ShipSetupInfo, 'appearance' | 'relationship'>;

/**
 * AI personality profiles that affect decision-making priorities.
 */
export type AiPersonality = 'aggressive' | 'defensive' | 'balanced' | 'patrol';

export interface AiSystemSetupInfo extends SystemSetupInfo {
    /**
     * Preference weight for AI decision making.
     * Higher values increase the priority of this system's wants and actions.
     * Default: 1.0
     */
    preferenceMultiplier?: number;
}

export interface AiShipSetupInfo extends ShipSetupInfo {
    helm: AiSystemSetupInfo;
    sensors: AiSystemSetupInfo;
    tactical: AiSystemSetupInfo;
    engineer: AiSystemSetupInfo;

    /**
     * The behavior profile of the AI.
     * - 'aggressive': Prioritizes attacks and weapon usage
     * - 'defensive': Prioritizes repairs and defensive actions
     * - 'balanced': Equal priority across all systems
     * - 'patrol': Prioritizes scanning and movement
     */
    personality: AiPersonality;

    /**
     * Multiplier for reaction time (higher = slower reactions).
     * Default: 1.0
     */
    reactionMultiplier?: number;
}

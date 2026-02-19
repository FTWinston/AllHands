import { CardInstance } from 'src/features/cards/types/CardInstance';
import { CardType } from 'src/features/cards/utils/cardDefinitions';
import { ShipSystem } from 'src/features/ships/types/ShipSystem';
import { SystemEffectInstance } from 'src/features/ships/types/SystemEffectDefinition';
import { CardCooldown, Cooldown } from 'src/types/Cooldown';
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
    powerLevel: number;
    health: number;
}

export interface CrewSystemInfo extends SystemInfo {
    hand: MinimalReadonlyArray<CardInstance>;
    cardGeneration: MinimalReadonlyArray<Cooldown>;
}

export interface HelmSystemInfo extends CrewSystemInfo {
    activeManeuver: MinimalReadonlyArray<CardCooldown>;
}

export interface EngineerSystemTileInfo {
    system: ShipSystem;
    power: number;
    health: number;
    effects: MinimalReadonlyArray<SystemEffectInstance>;
    generating: boolean;
}

export interface EngineerSystemInfo extends CrewSystemInfo {
    systems: MinimalReadonlyArray<EngineerSystemTileInfo>;
}

export interface ShipInfo extends GameObjectInfo {
    helmState: HelmSystemInfo;
    sensorState: CrewSystemInfo;
    tacticalState: CrewSystemInfo;
    engineerState: EngineerSystemInfo;
}

export interface SystemSetupInfo {
    initialPowerLevel: number;
    maxPowerLevel: number;
    health: number;
    maxHealth: number;
}

export interface CrewSystemSetupInfo extends SystemSetupInfo {
    cards: CardType[];
    initialHandSize: number;
}

export interface GameObjectSetupInfo {
    appearance: ObjectAppearance;
    relationship: RelationshipType;
}

export interface ShipSetupInfo extends GameObjectSetupInfo {
    position: Position;
    hull: SystemSetupInfo;
    reactor: SystemSetupInfo;
    helm: CrewSystemSetupInfo;
    sensors: CrewSystemSetupInfo;
    tactical: CrewSystemSetupInfo;
    engineer: CrewSystemSetupInfo;
}

export type PlayerShipSetupInfo = Omit<ShipSetupInfo, 'appearance' | 'relationship'>;

/**
 * AI personality profiles that affect decision-making priorities.
 */
export type AiPersonality = 'aggressive' | 'defensive' | 'balanced' | 'patrol';

export interface AiSystemSetupInfo extends CrewSystemSetupInfo {
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

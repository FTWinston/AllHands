import { IArray, IMap } from '@colyseus/react';
import { CardInstance } from 'src/features/cards/types/CardInstance';
import { CardType } from 'src/features/cards/utils/cardDefinitions';
import { ShipSystem } from 'src/features/ships/types/ShipSystem';
import { SystemEffectInstance } from 'src/features/ships/types/SystemEffectDefinition';
import { VulnerabilityType } from 'src/features/ships/types/VulnerabilityType';
import { CardCooldown, Cooldown } from 'src/types/Cooldown';
import { ReadonlyKeyframes } from './Keyframes';
import { ObjectAppearance } from './ObjectAppearance';
import { Position } from './Position';
import { RelationshipType } from './RelationshipType';

export type ObjectId = string;

export interface GameObjectInfo {
    id: ObjectId;
    name: string;
    appearance: ObjectAppearance;
    relationship: RelationshipType;
    motion: ReadonlyKeyframes<Position>;
}

export interface SystemInfo {
    powerLevel: number;
}

export interface CrewSystemInfo extends SystemInfo {
    maxHandSize: number;
    hand: IArray<CardInstance>;
    drawPileSize: number;
    cardGeneration: Cooldown | null;
}

export interface HelmSystemInfo extends CrewSystemInfo {
    activeManeuver: CardCooldown | null;
}

export interface WeaponSlotInfo {
    id: string;
    card: CardInstance | null;
    modifiers?: IMap<string, number>;
    damageType?: string | null;
    decay?: Cooldown | null;
    charge: number;
    primed: boolean;
}

export interface ScannedWeaponSlotInfo {
    id: string;
    card: CardInstance | null;
    modifiers?: IMap<string, number>;
    charge: number;
}

export interface VulnerabilityInfo {
    type: VulnerabilityType;
    aspect?: number;
}

export interface TargetVulnerabilities {
    vulnerabilities: IArray<VulnerabilityInfo>;
}

export interface TacticalSystemInfo extends CrewSystemInfo {
    vulnerabilitiesByTarget: IMap<string, TargetVulnerabilities>;
    slots: IArray<WeaponSlotInfo>;
}

export interface ScannedManeuverInfo {
    startTime: number;
    endTime: number;
    power: number;
}

export interface ScannedEngineerTileInfo {
    /** The ship system this tile represents. */
    system: ShipSystem;
    power: number;
    health: number;
}

export interface ScannedBaseInfo {
    targetId: string;
}

export interface ScannedHelmInfo extends ScannedBaseInfo {
    activeManeuver: CardInstance | null;
}

export interface ScannedTacticalInfo extends ScannedBaseInfo {
    weaponSlots: IArray<ScannedWeaponSlotInfo>;
}

export interface ScannedScienceInfo extends ScannedBaseInfo {
    scanSystems: IArray<ShipSystem>;
    deflectorCard: CardInstance | null;
}

export interface ScannedEngineerInfo extends ScannedBaseInfo {
    engineerTiles: IArray<ScannedEngineerTileInfo>;
}

export interface ScienceSystemInfo extends CrewSystemInfo {
    modifierSlotCard: CardInstance | null;
    substanceSlotCard: CardInstance | null;
    deliverySlotCard: CardInstance | null;
    deflectorCard: CardInstance | null;
    scannedShipId: string | null;
    scannedSystemOrder: IArray<number>;
    scannedHelm: ScannedHelmInfo | null;
    scannedTactical: ScannedTacticalInfo | null;
    scannedScience: ScannedScienceInfo | null;
    scannedEngineer: ScannedEngineerInfo | null;
}

export interface EngineerSystemTileInfo {
    system: ShipSystem;
    power: number;
    health: number;
    effects: IArray<SystemEffectInstance>;
    generating: boolean;
}

export interface EngineerSystemInfo extends CrewSystemInfo {
    systems: IArray<EngineerSystemTileInfo>;
    repairCapacity: number;
    maxRepairCapacity: number;
}

export interface ShipInfo extends GameObjectInfo {
    helmState: HelmSystemInfo;
    scienceState: ScienceSystemInfo;
    tacticalState: TacticalSystemInfo;
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

export interface TacticalSystemSetupInfo extends CrewSystemSetupInfo {
    numSlots: number;
}

export interface GameObjectSetupInfo {
    name: string;
    appearance: ObjectAppearance;
    relationship: RelationshipType;
}

export interface ShipSetupInfo extends GameObjectSetupInfo {
    position: Position;
    hull: SystemSetupInfo;
    reactor: SystemSetupInfo;
    helm: CrewSystemSetupInfo;
    science: CrewSystemSetupInfo;
    tactical: TacticalSystemSetupInfo;
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

export type AiTacticalSetupInfo = AiSystemSetupInfo & TacticalSystemSetupInfo;

export interface AiShipSetupInfo extends ShipSetupInfo {
    helm: AiSystemSetupInfo;
    science: AiSystemSetupInfo;
    tactical: AiTacticalSetupInfo;
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

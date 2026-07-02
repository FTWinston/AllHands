import { IArray, IMap } from '@colyseus/react';
import { CardInstance } from 'src/features/cards/types/CardInstance';
import { CardType } from 'src/features/cards/utils/cardDefinitions';
import { ShipSystem } from 'src/features/ships/types/ShipSystem';
import { SystemEffectInstance } from 'src/features/ships/types/SystemEffectDefinition';
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

export interface SubTargetInfo {
    /** Unique key for this sub-target. System targets use just the system name; vulnerability targets use 'system:vulnerabilityId'. */
    id: string;
    system: ShipSystem;
    aspect: number | null;
}

export interface TargetSubTargets {
    subTargets: IArray<SubTargetInfo>;
}

export interface TacticalSystemInfo extends CrewSystemInfo {
    subTargetsByTarget: IMap<string, TargetSubTargets>;
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

export interface ScannedSystemOrderInfo {
    order: IArray<number>;
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
    systemOrderByTarget: IMap<string, ScannedSystemOrderInfo>;
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

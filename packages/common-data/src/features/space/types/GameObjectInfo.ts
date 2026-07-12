import { IArray, IMap } from '@colyseus/react';
import { CardInstance } from 'src/features/cards/types/CardInstance';
import { WeaponTrait } from 'src/features/cards/types/CardTrait';
import { CardType } from 'src/features/cards/utils/cardDefinitions';
import { ShipSystem } from 'src/features/ships/types/ShipSystem';
import { SystemEffectInstance } from 'src/features/ships/types/SystemEffectDefinition';
import { CardCooldown, Cooldown } from 'src/types/Cooldown';
import { ReadonlyKeyframes } from './Keyframes';
import { ObjectAppearance } from './ObjectAppearance';
import { Position } from './Position';
import { RelationshipType } from './RelationshipType';

export type ObjectId = string;

/**
 * How a faction regards other factions, keyed by faction id (mirrors `FactionState.relations`
 * for a single faction).
 *
 * On the engine side this is a `MapSchema` (satisfies `IMap`); once it reaches a React
 * component via `useRoomState`, `@colyseus/react` snapshots it into a plain readonly
 * `Record` instead. Consumers that need to read a value out of this should use
 * `getDisplayRelationship`, which already handles both shapes.
 */
export type FactionRelationshipMap = IMap<string, RelationshipType> | Readonly<Record<string, RelationshipType>>;

/**
 * Identifies who is viewing the scene, for display-relationship purposes: their own ship
 * (so it can be recognised as Self), their faction, and that faction's relations towards
 * other factions.
 */
export interface RelationshipViewer {
    shipId: string | null;
    faction: string | null;
    relations: FactionRelationshipMap | null;
}

export interface GameObjectInfo {
    id: ObjectId;
    name: string;
    appearance: ObjectAppearance;
    /** Faction id, or null for unaffiliated objects (e.g. asteroids). */
    faction: string | null;
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
    extraTraits?: IArray<WeaponTrait>;
    decay?: Cooldown | null;
    charge: number;
    primed: boolean;
}

export interface ScannedWeaponSlotInfo {
    id: string;
    card: CardInstance | null;
    modifiers?: IMap<string, number>;
    extraTraits?: IArray<WeaponTrait>;
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
    evasionChance: number;
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
    faction?: string;
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

export type PlayerShipSetupInfo = Omit<ShipSetupInfo, 'appearance' | 'faction'>;

export type AiGoalInfo
    = | { type: 'search-and-destroy' }
        | { type: 'defend-position'; position: Position; radius: number }
        | { type: 'guard-ship'; shipId: string };

/** 'flee' is commander-reachable at runtime, but not setup-selectable. */
export type AiGoalType = AiGoalInfo['type'] | 'flee';

export interface AiPriorities {
    helm?: number;
    tactical?: number;
    science?: number;
    engineer?: number;
}

export interface AiShipSetupInfo extends ShipSetupInfo {
    goal: AiGoalInfo;
    /** 0..1 decision quality. 1 plays as well as the AI can; 0 is shambolic. */
    skill: number;
    /** Hull fraction below which the commander flees. Default 0.25; 0 = never flees. */
    fleeThreshold?: number;
    /** Per-role weighting, default 1 each. Affects engineer power allocation and officer thresholds. */
    priorities?: AiPriorities;
}

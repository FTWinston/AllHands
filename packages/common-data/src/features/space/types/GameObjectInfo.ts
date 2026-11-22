import { IArray, IMap } from '@colyseus/react';
import { CardInstance } from 'src/features/cards/types/CardInstance';
import { OutfitBundleInfo, SalvageCardInfo } from 'src/features/cards/types/CardRewardInfo';
import { NonEncounterCardInfo } from 'src/features/cards/types/NonEncounterCardInfo';
import { CardType, EnemyTargetedCardType, UntargetedCardType } from 'src/features/cards/utils/cardDefinitions';
import { CommsInfo } from 'src/features/sectors/types/CommsInfo';
import { SectorDestinationInfo } from 'src/features/sectors/types/SectorDestinationInfo';
import { CrewRoleName } from 'src/features/ships/types/CrewRole';
import { ShipSystem } from 'src/features/ships/types/ShipSystem';
import { SystemEffectInstance } from 'src/features/ships/types/SystemEffectDefinition';
import { CardCooldown, Cooldown } from 'src/types/Cooldown';
import { ReadonlyKeyframes } from './Keyframes';
import { ObjectAppearance } from './ObjectAppearance';
import { Position } from './Position';
import { RelationshipType } from './RelationshipType';
import { Vector2D } from './Vector2D';
import type { ShieldTuningEffect } from 'src/features/ships/utils/shieldStats';

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
    /**
     * True for a sensor ghost: a false contact that looks like a ship, but has nothing behind it.
     * It's only sent to those who aren't fooled by it (its own side), so it's absent for everyone else, who take it for a real ship.
     */
    isSensorGhost?: boolean;
}

export interface SystemInfo {
    powerLevel: number;
    /** How many of this system's cards are undamaged. */
    health: number;
    maxHealth: number;
}

export interface CrewSystemInfo extends SystemInfo {
    hand: IArray<CardInstance>;
    deck: IArray<CardInstance>;
    cardGeneration: Cooldown | null;
    /** Shown instead of the system's display while outside an encounter; empty during one (see `NonEncounterCardInfo`). */
    nonEncounterCards: IArray<NonEncounterCardInfo>;
    /** Cards on sale to this crew member at a shop station for their role (see `getShopRole`), each for its price (see `getShopCardPrice`). Empty elsewhere. */
    shopCards: IArray<CardInstance>;
    /** The type of the deck card this crew member placed a work order for, which is delivered at the next station. Null when there's none. */
    pendingOrder: CardType | null;
    /** Ids of the deck cards this crew member could place a work order for, at a shop station for another crew member. Empty elsewhere. */
    orderableCardIds: IArray<number>;
    /** Cards delivered by this crew member's work order, to choose one of for free. Lost on leaving the station. Empty when there's no delivery. */
    deliveryCards: IArray<CardInstance>;
    /** The most cards this system's deck can hold, which also caps its health (see `SystemSetupInfo.maxDeckSize`). */
    maxDeckSize: number;
    /**
     * Cards this crew member gained while their deck was full, waiting for them to replace a deck card with the first one, or discard it.
     * Either way, the card that goes is sold (see `cardSellPrice`). Only resolved outside an encounter.
     */
    incomingCards: IArray<CardInstance>;
    /** Cards offered at the first sector's outfitting station, to choose one of for free. Empty elsewhere, and once one is taken. */
    outfitCards: IArray<CardInstance>;
}

export interface HelmSystemInfo extends CrewSystemInfo {
    activeManeuver: CardCooldown | null;
    /** How many levels of Momentum the helm holds: the level of the `momentum` effect on the helm system. */
    momentumLevel: number;
    /** When the ship next loses a level of Momentum, as it has been still for a while. Null while it's moving, or has none. */
    momentumFade: Cooldown | null;
}

export interface WeaponSlotInfo {
    id: string;
    card: CardInstance | null;
    modifiers?: IMap<string, number>;
    decay?: Cooldown | null;
    charge: number;
    /** Whether the weapon has been given a modifier card. */
    modified: boolean;
    /** Whether the weapon has reached full charge since it was slotted. It can't fire before this. */
    hasBeenFullyCharged: boolean;
    /**
     * The id of the target a weapon with a `drainPerSecond` parameter is active on, having been fired at it. Empty (or absent) while it isn't active.
     * While it's active, it loses charge steadily (shown by `decay`) and can't be fired again. It ends when its charge runs out.
     */
    activeTargetId?: string;
    /**
     * For a cumbersome weapon: when each ship it could fire at was last brought into its firing arc and range, which it has to have stayed in since (see `cumbersomeAimTime`).
     * Keyed by the ship's id. A ship that isn't there isn't in position.
     */
    aimStartTimes?: IMap<string, number>;
}

export interface ScannedWeaponSlotInfo {
    id: string;
    card: CardInstance | null;
    modifiers?: IMap<string, number>;
    charge: number;
    /** The modifier card played onto this weapon, if any. */
    modifierCard: CardType | null;
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
    /** The id of the ship that Lock is held against. Empty while there's no Lock. */
    lockTargetId: string;
    /** How many levels of Lock are held against that ship: the level of the `lock` effect on the tactical system. */
    lockLevel: number;
    /** The id of the object that tactical's client is showing as its target, which the rest of the crew's screens mark. Empty if none. */
    selectedTargetId?: string;
    /** Whether weapons can't fire just now, as the Hold Fire card says. */
    holdingFire?: boolean;
    /** Whether the helm is holding the ship steady, so that cumbersome weapons don't have to hold their aim. */
    aimSteadied?: boolean;
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
    /** The index in `shipSystems` of the system in each of a target's four scan slots, or 0 for a slot not yet identified (the hull is never scanned). */
    order: IArray<number>;
}

export interface ScannedBaseInfo {
    targetId: string;
    /** The scanned system's current power level. */
    power: number;
    /**
     * The cards in the scanned system's hand, once science has read it (with a scan card dropped on a revealed system), kept up to date as they're drawn and played.
     * Null while the hand hasn't been read: reading it lasts only as long as science goes on scanning this system.
     */
    hand: IArray<CardInstance> | null;
}

export interface ScannedHelmInfo extends ScannedBaseInfo {
    activeManeuver: CardInstance | null;
    /** When the active maneuver started, and when it will end. */
    maneuverProgress: Cooldown | null;
    evasionChance: number;
}

export interface ScannedTacticalInfo extends ScannedBaseInfo {
    weaponSlots: IArray<ScannedWeaponSlotInfo>;
}

export interface ScannedScienceInfo extends ScannedBaseInfo {
    scanSystem: ShipSystem | null;
    deflectorCard: CardInstance | null;
}

export interface ScannedEngineerInfo extends ScannedBaseInfo {
    engineerTiles: IArray<ScannedEngineerTileInfo>;
}

/** The hull of the ship that science is scanning, which science and tactical can both see. */
export interface ScannedHullInfo {
    /** Empty while science isn't scanning a ship. */
    targetId: string;
    health: number;
    maxHealth: number;
    shield: number;
    /** The ship's shield capacity. */
    maxShield: number;
    /** The ship's current shield tuning, if any. */
    shieldTuning: ShieldTuningEffect | null;
}

export interface ScienceSystemInfo extends CrewSystemInfo {
    modifierSlotCard: CardInstance | null;
    substanceSlotCard: CardInstance | null;
    deliverySlotCard: CardInstance | null;
    deflectorCard: CardInstance;
    scannedShipId: string | null;
    scannedSystemOrder: IArray<number>;
    systemOrderByTarget: IMap<string, ScannedSystemOrderInfo>;
    identifiedVulnerability: EnemyTargetedCardType | null;
    scannedHelm: ScannedHelmInfo | null;
    scannedTactical: ScannedTacticalInfo | null;
    scannedScience: ScannedScienceInfo | null;
    scannedEngineer: ScannedEngineerInfo | null;
    /** Long range sensor readings of the nodes the ship can travel to next; empty except on the sector map. */
    destinations: IArray<SectorDestinationInfo>;
    /** How much Insight science holds, which some of its cards spend. */
    insight: number;
    /** The game time at which science last found a sensor ghost where it expected a ship, or 0 if it never has. */
    ghostExposedTime?: number;
}

export interface EngineerSystemTileInfo {
    system: ShipSystem;
    power: number;
    /** How many of the system's cards work, including stabilised ones. */
    health: number;
    /** How many cards the system has, other than expendable ones: health, plus damaged and critically damaged cards. */
    maxHealth: number;
    /** How much of the system's health is from stabilised cards, which are critically damaged if they're damaged again. */
    stabilised: number;
    /** How many of the system's cards are damaged, and so can be repaired. */
    damaged: number;
    /** How many of the system's cards are critically damaged, and so can't be repaired. */
    critical: number;
    effects: IArray<SystemEffectInstance>;
    generating: boolean;
    /** The system's own hand, so the engineer can see it. Hull and reactor cards only pass through their hand as they're played. */
    hand: IArray<CardInstance>;
    /** The system's own deck, in draw order. */
    deck: IArray<CardInstance>;
}

/** The hull's engineer tile, which also has the hull's shields. */
export interface HullSystemTileInfo extends EngineerSystemTileInfo {
    system: 'hull';
    shield: number;
    /** The hull's shield capacity, which stays known while the shields are down. */
    maxShield: number;
}

/** Whether an engineer tile is the hull's, which always has the hull's extra fields. */
export function isHullSystemTile<T extends { system: ShipSystem }>(tile: T): tile is T & Pick<HullSystemTileInfo, 'system' | 'shield' | 'maxShield'> {
    return tile.system === 'hull';
}

export interface EngineerSystemInfo extends CrewSystemInfo {
    systems: IArray<EngineerSystemTileInfo>;
    repairCapacity: number;
    maxRepairCapacity: number;
}

export interface ShipInfo extends GameObjectInfo {
    hullState: SystemInfo;
    helmState: HelmSystemInfo;
    scienceState: ScienceSystemInfo;
    tacticalState: TacticalSystemInfo;
    engineerState: EngineerSystemInfo;
    /** The hull of the ship that science is scanning, from when it first scans any of that ship's systems until it scans another ship, or loses this one. */
    scannedHull: ScannedHullInfo;
}

export interface PlayerShipInfo extends ShipInfo {
    /** The ship's currency, earned by completing encounters (see `antimatterRewards`). Only synced to the ship's own crew and game client. */
    antimatter: number;

    /** How many work orders the ship's crew has placed this game, which raises the price of the next (see `getOrderPrice`). Synced like `antimatter`. */
    ordersPlaced: number;

    /**
     * Non-expendable card types the crew has seen, starting with those its game client knew from earlier games.
     * The game client adds new ones to its known cards. Only synced to the ship's game client.
     */
    seenCardTypes: IArray<CardType>;

    /** What's coming in over comms that the crew has to deal with. Only synced to the ship's game client and tactical. */
    comms: CommsInfo;

    /**
     * A short, distinct label for each other object this ship's crew has known of, by object id, such as "Alpha": what the crew calls it, as names can be shared.
     * Synced to the ship's game client, helm, science and tactical, so every screen labels a contact the same.
     */
    contactLabels?: IMap<string, string>;

    /** The id of the object that tactical is aiming at, or empty. Synced to the ship's game client and helm, which can't see tactical's own state. */
    tacticalTargetId?: string;

    /** The id of the ship that science is scanning, or empty. Synced to the ship's game client and helm, which can't see science's own state. */
    scienceTargetId?: string;

    /** Cards salvaged after a successful fight, one for each of three crew members, until one is taken or they're scrapped. Synced to the ship's game client and crew. */
    salvage: IArray<SalvageCardInfo>;

    /** The crew member who chooses which salvaged card the ship takes, while there's salvage, otherwise empty. Synced like `salvage`. */
    salvageChooser: CrewRoleName | '';

    /** Whether the chooser is holding the salvage out of the way, so the viewscreen can show the sector map behind it. Synced to the ship's game client. */
    salvageHidden: boolean;

    /** Bundles offered at an outfitting station after the first sector, until the crew agree on one. Synced like `salvage`. */
    outfitBundles: IArray<OutfitBundleInfo>;

    /** The index into `outfitBundles` that each crew member has voted for, keyed by their role. Synced like `salvage`. */
    bundleVotes: IMap<string, number>;

    /** The crew members still choosing their card at the first sector's outfitting station, in role order. Synced to the ship's game client, which can't see their cards. */
    outfitPickers: IArray<CrewRoleName>;
}

export interface SystemSetupInfo {
    cards: CardType[];
    initialHandSize: number;
    maxPowerLevel: number;
    /** The most cards a crew system's deck can hold, which also caps its health. Defaults to `defaultMaxDeckSize`. */
    maxDeckSize?: number;
}

export interface NonCrewSystemSetupInfo extends SystemSetupInfo {
    cards: UntargetedCardType[];
}

export interface TacticalSystemSetupInfo extends SystemSetupInfo {
    numSlots: number;
}

export interface GameObjectSetupInfo {
    name: string;
    appearance: ObjectAppearance;
    faction?: string;
    /**
     * Stable, author-chosen identifier used only to let *other parts of the same scenario*
     * (e.g. an AI ship's `guard-ship` goal, or a future victory condition) refer to this
     * object. This is unrelated to `GameObjectInfo.id`, the runtime id assigned from the
     * server's id pool once the object is actually created: that id isn't known until then,
     * and isn't stable (ids are reused once released), so scenario files can't reference it
     * directly. Once the object exists, this scenario-authored id is available at runtime as
     * `GameObject.scenarioId`.
     *
     * Should be unique within a scenario. If several spawned objects share the same id (e.g.
     * multiple player ships in multi-crew mode, or several respawns of the same enemy
     * template), a lookup by this id resolves to whichever of them was added most recently.
     */
    id?: string;
}

export interface ShipSetupInfo extends GameObjectSetupInfo {
    position: Position;
    hull: NonCrewSystemSetupInfo;
    reactor: NonCrewSystemSetupInfo;
    helm: SystemSetupInfo;
    science: SystemSetupInfo;
    tactical: TacticalSystemSetupInfo;
    engineer: SystemSetupInfo;
}

export type PlayerShipSetupInfo = Omit<ShipSetupInfo, 'appearance' | 'faction'>;

export type AiGoalInfo
    /**
     * `prefer` is a ship to go after ahead of any other hostile, unless another is very much closer.
     * Like `guard-ship`'s `shipId`, it can be the scenario-authored `id` of an object in the same batch.
     */
    = | { type: 'search-and-destroy'; prefer?: string }
        | { type: 'defend-position'; position: Position; radius: number }
        /**
         * Fly to each waypoint in turn, then hold at the last. The ship doesn't turn aside for anything on the way,
         * though it still shoots at whatever hostiles come within reach.
         */
        | { type: 'travel-route'; waypoints: Vector2D[]; arrivalRadius: number }
        /**
         * `shipId` is normally a live runtime object id. When authored in a scenario file
         * (where the runtime id can't be known in advance) it should instead be the target
         * object's scenario-authored `id` (see `GameObjectSetupInfo.id`); the engine resolves
         * it to the real id once the referenced object exists.
         */
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

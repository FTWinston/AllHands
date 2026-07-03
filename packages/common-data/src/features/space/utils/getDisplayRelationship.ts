import { IMap } from '@colyseus/react';
import { ScenarioConfig } from '../../../types/ScenarioConfig';
import { FactionRelationshipMap, RelationshipViewer } from '../types/GameObjectInfo';
import { RelationshipType } from '../types/RelationshipType';

/**
 * A viewer's `relations` is a `MapSchema` on the engine side, but arrives as a plain
 * snapshot `Record` once it has passed through `useRoomState` on the UI side. Narrow to
 * the map-like form via a type guard, so both shapes read correctly here.
 */
function isFactionRelationshipMapLike(
    map: FactionRelationshipMap
): map is IMap<string, RelationshipType> {
    return typeof (map as IMap<string, RelationshipType>).get === 'function';
}

/**
 * The relationship to display for an object, from a particular viewer's point of view.
 * Mirrors `FactionRegistry.getRelationshipBetween`, plus a Self case for the viewer's own ship.
 */
export function getDisplayRelationship(
    object: { id: string; faction: string | null },
    viewer: RelationshipViewer
): RelationshipType {
    if (viewer.shipId !== null && object.id === viewer.shipId) {
        return RelationshipType.Self;
    }
    if (!object.faction || !viewer.faction) {
        return RelationshipType.None;
    }
    if (object.faction === viewer.faction) {
        return RelationshipType.Friendly;
    }

    const { relations } = viewer;
    if (!relations) {
        return RelationshipType.Neutral;
    }

    const relationship = isFactionRelationshipMapLike(relations)
        ? relations.get(object.faction)
        : relations[object.faction];
    return relationship ?? RelationshipType.Neutral;
}

/** Resolve a setup-time faction to its relationship with the scenario's player faction (for preloading). */
export function resolveSetupRelationship(config: ScenarioConfig, faction: string | undefined): RelationshipType {
    if (!faction) {
        return RelationshipType.None;
    }
    if (faction === config.playerFaction) {
        return RelationshipType.Friendly;
    }
    const declared = [
        config.factions.find(f => f.id === config.playerFaction)?.relations?.[faction],
        config.factions.find(f => f.id === faction)?.relations?.[config.playerFaction],
    ].filter((r): r is RelationshipType => r !== undefined);

    if (declared.includes(RelationshipType.Hostile)) {
        return RelationshipType.Hostile;
    }
    return declared[0] ?? RelationshipType.Neutral;
}

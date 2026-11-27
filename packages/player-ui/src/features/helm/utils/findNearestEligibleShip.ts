import { ShipTargetCardDefinition, ShipTargetRelationship } from 'common-data/features/cards/types/CardDefinition';
import { cardDefinitions, CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { isEligibleShipTarget } from 'common-data/features/cards/utils/isEligibleShipTarget';
import { GameObjectInfo, RelationshipViewer } from 'common-data/features/space/types/GameObjectInfo';
import { isShipAppearance } from 'common-data/features/space/types/ObjectAppearance';
import { Position } from 'common-data/features/space/types/Position';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { getDisplayRelationship } from 'common-data/features/space/utils/getDisplayRelationship';
import { interpolatePosition } from 'common-data/features/space/utils/interpolate';
import { distanceSq } from 'common-data/features/space/utils/vectors';

export type ShipTargetCandidate = {
    ship: GameObjectInfo;
    /** Where the ship is at the time it was picked. */
    position: Position;
};

/** The relationship that the given card wants with the ship it's played on (undefined for any), or null if it isn't played on a ship. */
export function getShipTargetRelationship(cardType: CardType): ShipTargetRelationship | undefined | null {
    const definition = cardDefinitions[cardType];
    return definition.targetType === 'ship' ? (definition as ShipTargetCardDefinition).targetRelationship : null;
}

/** Whether the given object is a ship: a player's ship (drawn as a chevron), or one with a ship drawing. A sensor ghost isn't, to those who know it for one. */
function isShip(object: GameObjectInfo): boolean {
    return !object.isSensorGhost && (object.appearance === 'chevron' || isShipAppearance(object.appearance));
}

/**
 * The ship closest to the given location, at the given time, that a card wanting the given relationship could be played on by the viewer's ship.
 * Null if there's no such ship. The server checks the same eligibility (see `SystemState.resolveShipTarget`).
 */
export function findNearestEligibleShip(
    objects: Readonly<Record<string, GameObjectInfo>>,
    viewer: RelationshipViewer,
    location: Vector2D,
    relationship: ShipTargetRelationship | undefined,
    time: number
): ShipTargetCandidate | null {
    let nearest: ShipTargetCandidate | null = null;
    let nearestDistanceSq = Infinity;

    for (const object of Object.values(objects)) {
        if (!isShip(object) || !isEligibleShipTarget(getDisplayRelationship(object, viewer), relationship)) {
            continue;
        }

        const position = interpolatePosition(object.motion, time);
        const objectDistanceSq = distanceSq(location, position);
        if (objectDistanceSq < nearestDistanceSq) {
            nearest = { ship: object, position };
            nearestDistanceSq = objectDistanceSq;
        }
    }

    return nearest;
}

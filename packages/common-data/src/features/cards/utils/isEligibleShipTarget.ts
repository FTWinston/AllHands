import { RelationshipType } from 'src/features/space/types/RelationshipType';
import type { ShipTargetRelationship } from '../types/CardDefinition';

/**
 * Whether a ship-targeted card that wants the given relationship can be played on a ship that the playing ship has this relationship with.
 * A ship can never target itself; hostile and friendly cards only take ships that are exactly that, and any other ship (neutral, or unaffiliated) only suits a card that takes any.
 */
export function isEligibleShipTarget(relationship: RelationshipType, wanted: ShipTargetRelationship = 'any'): boolean {
    if (relationship === RelationshipType.Self) {
        return false;
    }

    switch (wanted) {
        case 'hostile':
            return relationship === RelationshipType.Hostile;
        case 'friendly':
            return relationship === RelationshipType.Friendly;
        case 'any':
            return true;
    }
}

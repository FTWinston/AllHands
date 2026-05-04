import { RelationshipType } from 'common-data/features/space/types/RelationshipType';

export function getColors(relationship: RelationshipType): [string, string] {
    switch (relationship) {
        case RelationshipType.Hostile:
            return ['#b00', '#f66'];
        case RelationshipType.Neutral:
            return ['#06c', '#39f'];
        case RelationshipType.Friendly:
            return ['#0b0', '#6f6'];
        case RelationshipType.Unknown:
            return ['#bb0', '#ff6'];
        case RelationshipType.Self:
            return ['#ccc', '#fff'];
        case RelationshipType.None:
        default:
            return ['#777', '#444'];
    }
}

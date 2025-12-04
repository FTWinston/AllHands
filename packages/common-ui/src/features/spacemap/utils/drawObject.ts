import { ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { DrawFunction } from '../types/DrawFunction';
import { drawChevron } from './appearances/drawChevron';
import { drawCircle } from './appearances/drawCircle';

export const drawFunctions: Record<ObjectAppearance, DrawFunction> = {
    chevron: drawChevron,
    circle: drawCircle,
};

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

export function drawObject(
    ctx: CanvasRenderingContext2D,
    appearance: ObjectAppearance,
    relationship: RelationshipType
) {
    const drawFunction = drawFunctions[appearance];
    if (!drawFunction) {
        throw new Error(`No draw function for type: ${appearance}`);
    }

    const [mainColor, highlight] = getColors(relationship);

    return drawFunction(ctx, mainColor, highlight);
}

import { ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { getColors } from './relationshipColors';
import { getSvgBitmap } from './svgBitmapCache';

export { getColors } from './relationshipColors';
export { preloadFromScenario, preloadSvgBitmaps } from './svgBitmapCache';

export function drawObject(
    ctx: CanvasRenderingContext2D,
    appearance: ObjectAppearance,
    relationship: RelationshipType
): void {
    const [mainColor, highlight] = getColors(relationship);
    const bitmap = getSvgBitmap(appearance, mainColor, highlight);
    if (bitmap) {
        ctx.drawImage(bitmap, -1, -1, 2, 2);
    }
}

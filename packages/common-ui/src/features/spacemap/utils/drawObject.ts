import { ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { getColors } from './relationshipColors';
import { getSvgBitmap } from './svgBitmapCache';
import type { ShipMapStyle } from '../../../objects/mapSvg';

export { getColors } from './relationshipColors';
export { preloadSvgBitmaps } from './svgBitmapCache';

export function drawObject(
    ctx: CanvasRenderingContext2D,
    appearance: ObjectAppearance,
    relationship: RelationshipType,
    shipStyle?: ShipMapStyle
): void {
    const [mainColor, highlight] = getColors(relationship);
    const bitmap = getSvgBitmap(appearance, mainColor, highlight, shipStyle);
    if (bitmap) {
        ctx.drawImage(bitmap, -1, -1, 2, 2);
    }
}

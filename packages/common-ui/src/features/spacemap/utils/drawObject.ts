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

/** How see-through a sensor ghost is drawn. */
const ghostAlpha = 0.4;

/** How a sensor ghost's outline is dashed, and how thick it is, in pixels. */
const ghostDash = [6, 5];
const ghostOutlineWidth = 1.5;

/**
 * Draw a sensor ghost, which is what its own side sees a false contact as: its ship's drawing, but see-through, inside a dashed outline.
 * `pixelSize` is how big a pixel is in the units that the context is drawing in.
 */
export function drawGhostObject(
    ctx: CanvasRenderingContext2D,
    appearance: ObjectAppearance,
    relationship: RelationshipType,
    pixelSize: number,
    shipStyle?: ShipMapStyle
): void {
    const [mainColor] = getColors(relationship);

    ctx.save();

    ctx.globalAlpha *= ghostAlpha;
    drawObject(ctx, appearance, relationship, shipStyle);

    ctx.strokeStyle = mainColor;
    ctx.lineWidth = ghostOutlineWidth * pixelSize;
    ctx.setLineDash(ghostDash.map(length => length * pixelSize));
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}

/** Write a sensor ghost's label under it. The context should be at the ghost's position, and not turned. */
export function drawGhostLabel(ctx: CanvasRenderingContext2D, relationship: RelationshipType, pixelSize: number): void {
    const [mainColor] = getColors(relationship);

    ctx.save();
    ctx.globalAlpha *= 0.8;
    ctx.fillStyle = mainColor;
    ctx.font = `${11 * pixelSize}px sans-serif`;
    ctx.fillText('Sensor ghost', 0, 1.4);
    ctx.restore();
}

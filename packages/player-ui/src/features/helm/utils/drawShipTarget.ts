import { Vector2D } from 'common-data/features/space/types/Vector2D';

const TARGET_COLOR = 'oklch(80% 0.22 200)';
const LINE_COLOR = 'oklch(80% 0.22 200 / 0.75)';
const POINTER_LINE_COLOR = 'oklch(80% 0.22 200 / 0.4)';

/** The radius of the ring drawn around the target ship, in world units. */
const RING_RADIUS = 0.8;

/**
 * Draw which ship a ship-targeted card would be played on: a ring around that ship, with a dashed line to it from the player's ship,
 * and a fainter line to it from the hexagon the card is over.
 * @param pixelSize - Size of one pixel in world units (for consistent line widths)
 */
export function drawShipTarget(
    ctx: CanvasRenderingContext2D,
    shipPosition: Vector2D,
    targetPosition: Vector2D,
    pointerPosition: Vector2D,
    pixelSize: number
) {
    ctx.save();
    ctx.lineCap = 'round';

    ctx.strokeStyle = POINTER_LINE_COLOR;
    ctx.lineWidth = pixelSize * 2;
    ctx.beginPath();
    ctx.moveTo(pointerPosition.x, pointerPosition.y);
    ctx.lineTo(targetPosition.x, targetPosition.y);
    ctx.stroke();

    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = pixelSize * 4;
    ctx.setLineDash([pixelSize * 10, pixelSize * 8]);
    ctx.beginPath();
    ctx.moveTo(shipPosition.x, shipPosition.y);
    ctx.lineTo(targetPosition.x, targetPosition.y);
    ctx.stroke();

    ctx.strokeStyle = TARGET_COLOR;
    ctx.lineWidth = pixelSize * 5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(targetPosition.x, targetPosition.y, RING_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}

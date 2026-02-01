import { MotionPathKeyframe } from 'common-data/features/cards/utils/calculateMotionPath';

const PATH_COLOR = 'rgba(100, 200, 255, 0.8)';
const ARROWHEAD_COLOR = 'rgba(100, 200, 255, 0.9)';

/**
 * Draw a motion path preview on the canvas.
 * Shows the path the ship will take with arrowheads at each keyframe
 * indicating the facing direction.
 *
 * @param ctx - Canvas rendering context (already transformed to world coordinates)
 * @param keyframes - Array of keyframes defining the motion path
 * @param pixelSize - Size of one pixel in world units (for consistent line widths)
 */
export function drawMotionPath(
    ctx: CanvasRenderingContext2D,
    keyframes: readonly MotionPathKeyframe[],
    pixelSize: number
): void {
    if (keyframes.length < 2) {
        return;
    }

    const lineWidth = pixelSize * 2;
    const arrowSize = 0.35; // Size of arrowhead in world units

    // Draw the path line
    ctx.strokeStyle = PATH_COLOR;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(keyframes[0].x, keyframes[0].y);

    for (let i = 1; i < keyframes.length; i++) {
        ctx.lineTo(keyframes[i].x, keyframes[i].y);
    }

    ctx.stroke();

    // Draw arrowheads at each keyframe (except the first, which is the current position)
    ctx.fillStyle = ARROWHEAD_COLOR;

    for (let i = 1; i < keyframes.length; i++) {
        const keyframe = keyframes[i];
        drawArrowhead(ctx, keyframe.x, keyframe.y, keyframe.angle, arrowSize);
    }
}

/**
 * Draw an arrowhead pointing in a specific direction.
 * The arrowhead points in the direction the ship is facing.
 *
 * @param ctx - Canvas rendering context
 * @param x - X position of the arrowhead center
 * @param y - Y position of the arrowhead center
 * @param angle - Angle the arrowhead should point (in radians, 0 = right)
 * @param size - Size of the arrowhead
 */
function drawArrowhead(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    size: number
): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-angle); // Negative because canvas Y is inverted from our coordinate system

    // Draw a chevron/arrow shape pointing right (angle 0)
    ctx.beginPath();
    ctx.moveTo(size * 0.6, 0); // Tip of arrow
    ctx.lineTo(-size * 0.4, size * 0.4); // Bottom-left
    ctx.lineTo(-size * 0.2, 0); // Inner back
    ctx.lineTo(-size * 0.4, -size * 0.4); // Top-left
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

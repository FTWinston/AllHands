import { MotionPathKeyframe } from 'common-data/features/cards/utils/calculateMotionPath';

const PATH_COLOR = 'rgba(100, 200, 255, 0.8)';
const ARROWHEAD_COLOR = 'rgba(100, 200, 255, 0.9)';

// Number of intermediate points to draw between each pair of keyframes for smooth curves
const CURVE_SEGMENTS = 10;

/**
 * Interpolate a value using Catmull-Rom spline (centripetal).
 * This matches the interpolation used in the game engine.
 */
function catmullRomInterpolate(
    val0: number | undefined,
    val1: number,
    val2: number,
    val3: number | undefined,
    fraction: number
): number {
    if (val0 === undefined) {
        val0 = val1;
    }
    if (val3 === undefined) {
        val3 = val2;
    }

    // Get distances between points (non-zero to avoid division by zero)
    const dist = (a: number, b: number) => Math.max(Math.abs(b - a), 0.00000001);

    // Exponent of 0.5 makes this a centripetal Catmull-Rom spline
    const t01 = Math.pow(dist(val0, val1), 0.5);
    const t12 = Math.pow(dist(val1, val2), 0.5);
    const t23 = Math.pow(dist(val2, val3), 0.5);

    const m1 = val2 - val1 + t12 * ((val1 - val0) / t01 - (val2 - val0) / (t01 + t12));
    const m2 = val2 - val1 + t12 * ((val3 - val2) / t23 - (val3 - val1) / (t12 + t23));

    const a = 2 * (val1 - val2) + m1 + m2;
    const b = -3 * (val1 - val2) - m1 - m1 - m2;
    const c = m1;

    return a * fraction * fraction * fraction
        + b * fraction * fraction
        + c * fraction
        + val1;
}

/**
 * Get an interpolated point along the path between keyframes.
 */
function getInterpolatedPoint(
    keyframes: readonly MotionPathKeyframe[],
    segmentIndex: number,
    fraction: number
): { x: number; y: number } {
    const k0 = keyframes[segmentIndex - 1];
    const k1 = keyframes[segmentIndex];
    const k2 = keyframes[segmentIndex + 1];
    const k3 = keyframes[segmentIndex + 2];

    return {
        x: catmullRomInterpolate(k0?.x, k1.x, k2.x, k3?.x, fraction),
        y: catmullRomInterpolate(k0?.y, k1.y, k2.y, k3?.y, fraction),
    };
}

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

    // Draw the path line with smooth curves
    ctx.strokeStyle = PATH_COLOR;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(keyframes[0].x, keyframes[0].y);

    // For each segment between keyframes, draw interpolated curve points
    for (let i = 0; i < keyframes.length - 1; i++) {
        for (let s = 1; s <= CURVE_SEGMENTS; s++) {
            const fraction = s / CURVE_SEGMENTS;
            const point = getInterpolatedPoint(keyframes, i, fraction);
            ctx.lineTo(point.x, point.y);
        }
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

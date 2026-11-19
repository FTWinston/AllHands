import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { interpolatePosition } from 'common-data/features/space/utils/interpolate';
import { Rectangle } from '../types/Rectangle';

/** The colours of the crews' reticles, matching the crew colours (see `CrewColors.module.css`), but brighter, to stand out against a map. */
export const tacticalReticleColor = 'oklch(0.86 0.17 90)';
export const scienceReticleColor = 'oklch(0.74 0.2 260)';

/** The ids of the objects that tactical and science are targeting, either of which can be empty or missing. */
export type ReticleTargets = {
    tacticalTargetId?: string | null;
    scienceTargetId?: string | null;
};

/** How far from an object's centre each reticle is drawn, in world units: a ship's drawing reaches 1, so tactical's is just outside it, and science's outside that. */
const tacticalRadius = 1.3;
const scienceRadius = 1.8;

/** How long each of tactical's corner brackets is, and how long science's ticks are, in world units. */
const bracketLength = 0.5;
const tickLength = 0.3;

/** How long science's ring takes to turn once, in milliseconds. */
const ringTurnTime = 12000;

/** A dark edge under each reticle's line, in pixels either side, so that it shows against bright ships and light backgrounds. */
const edgeWidth = 1.5;
const lineWidth = 2.5;
const edgeColor = 'rgba(2, 7, 12, 0.8)';

/** Draw a path twice: first wider and dark, then in its colour. */
function strokeWithEdge(ctx: CanvasRenderingContext2D, color: string, pixelSize: number) {
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = (lineWidth + edgeWidth * 2) * pixelSize;
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth * pixelSize;
    ctx.stroke();
}

/** Tactical's reticle: four corner brackets, as of a gun sight. The context should be at the object's position. */
export function drawTacticalReticle(ctx: CanvasRenderingContext2D, time: number, pixelSize: number) {
    // Breathes slightly, so that it reads as live.
    const radius = tacticalRadius + Math.sin(time / 250) * 0.04;

    ctx.beginPath();
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        ctx.moveTo(sx * radius, sy * (radius - bracketLength));
        ctx.lineTo(sx * radius, sy * radius);
        ctx.lineTo(sx * (radius - bracketLength), sy * radius);
    }
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    ctx.setLineDash([]);
    strokeWithEdge(ctx, tacticalReticleColor, pixelSize);
}

/** Science's reticle: a slowly turning dashed ring with four ticks pointing in at the object, as of a sensor lock. The context should be at the object's position. */
export function drawScienceReticle(ctx: CanvasRenderingContext2D, time: number, pixelSize: number) {
    const circumference = Math.PI * 2 * scienceRadius;
    // 16 dashes round the ring, each three-fifths of its share.
    const share = circumference / 16;

    ctx.lineCap = 'butt';
    ctx.setLineDash([share * 0.6, share * 0.4]);
    ctx.lineDashOffset = -(time % ringTurnTime) / ringTurnTime * circumference;
    ctx.beginPath();
    ctx.arc(0, 0, scienceRadius, 0, Math.PI * 2);
    strokeWithEdge(ctx, scienceReticleColor, pixelSize);

    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
        const angle = i * Math.PI / 2;
        ctx.moveTo(Math.cos(angle) * (scienceRadius - tickLength), Math.sin(angle) * (scienceRadius - tickLength));
        ctx.lineTo(Math.cos(angle) * (scienceRadius + tickLength * 0.4), Math.sin(angle) * (scienceRadius + tickLength * 0.4));
    }
    strokeWithEdge(ctx, scienceReticleColor, pixelSize);
}

/**
 * Mark whichever objects tactical and science are targeting, each in its crew's colour and shape. An object that both are targeting gets both, one inside the other.
 * Anything not among the objects (e.g. out of sensor range) is skipped. The context should be in world units, and not turned.
 */
export function drawTargetReticles(
    ctx: CanvasRenderingContext2D,
    objects: Readonly<Record<string, Pick<GameObjectInfo, 'motion'>>>,
    targets: ReticleTargets,
    time: number,
    pixelSize: number
) {
    const draw = (id: string | null | undefined, drawReticle: typeof drawTacticalReticle) => {
        const object = id ? objects[id] : undefined;
        if (!object) {
            return;
        }

        const position = interpolatePosition(object.motion, time);
        ctx.save();
        ctx.translate(position.x, position.y);
        drawReticle(ctx, time, pixelSize);
        ctx.restore();
    };

    draw(targets.scienceTargetId, drawScienceReticle);
    draw(targets.tacticalTargetId, drawTacticalReticle);
}

/** How far past the edge of the view an object's centre must be before it counts as off screen, in world units: a ship's drawing reaches 1, so it's wholly out of view. */
const offscreenMargin = 1;

/** How far in from the edge of the view each arrow's tip sits, in pixels. When both crews are after the same contact, science's sits just behind tactical's, so both show. */
const tacticalArrowInset = 16;
const scienceArrowInset = 50;

/** The size of each arrow, in pixels: its whole length, tail included, and its head's length and width. */
const arrowLength = 28;
const arrowHeadLength = 10;
const arrowHeadWidth = 14;

/** The size of the contact label written beside an arrow, in pixels. */
const arrowLabelSize = 12;

/** Whether an object at the given position is wholly out of view, so that none of its drawing shows. */
export function isWhollyOffscreen(bounds: Rectangle, position: { x: number; y: number }) {
    return position.x <= bounds.x - offscreenMargin
        || position.x >= bounds.x + bounds.width + offscreenMargin
        || position.y <= bounds.y - offscreenMargin
        || position.y >= bounds.y + bounds.height + offscreenMargin;
}

/** How far in from each side of the view to keep a point, in world units. */
export type EdgeInsets = Record<'top' | 'right' | 'bottom' | 'left', number>;

/**
 * Where the line from the middle of the view towards a point leaves the view, brought in from each side by the given distances (in world units).
 * Returns that position in world units, and the angle the point is in from the middle.
 */
export function getEdgePoint(bounds: Rectangle, target: { x: number; y: number }, insets: EdgeInsets) {
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const dx = target.x - centerX;
    const dy = target.y - centerY;

    // The area the point has to stay in, which never shrinks past the middle of the view.
    const left = Math.min(bounds.x + insets.left, centerX);
    const right = Math.max(bounds.x + bounds.width - insets.right, centerX);
    const top = Math.min(bounds.y + insets.top, centerY);
    const bottom = Math.max(bounds.y + bounds.height - insets.bottom, centerY);

    // Scale the direction down until it reaches whichever edge of that area it meets first.
    const scale = Math.min(
        dx > 0 ? (right - centerX) / dx : dx < 0 ? (left - centerX) / dx : Infinity,
        dy > 0 ? (bottom - centerY) / dy : dy < 0 ? (top - centerY) / dy : Infinity
    );

    return { x: centerX + dx * scale, y: centerY + dy * scale, angle: Math.atan2(dy, dx) };
}

/**
 * Draw an arrow with its tip at the context's origin, pointing along +x, with a straight tail behind its head:
 * tactical's has a solid head, and science's just the head's two lines, so they tell apart by shape as well as colour.
 * The context should be in world units, turned to point the arrow.
 */
function drawArrow(ctx: CanvasRenderingContext2D, color: string, solidHead: boolean, pixelSize: number) {
    const length = arrowLength * pixelSize;
    const headLength = arrowHeadLength * pixelSize;
    const headHalfWidth = arrowHeadWidth / 2 * pixelSize;

    ctx.setLineDash([]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    if (solidHead) {
        // The tail runs to the base of the head, which is filled in below.
        ctx.moveTo(-length, 0);
        ctx.lineTo(-headLength, 0);
    } else {
        ctx.moveTo(-length, 0);
        ctx.lineTo(0, 0);
        ctx.moveTo(-headLength, -headHalfWidth);
        ctx.lineTo(0, 0);
        ctx.lineTo(-headLength, headHalfWidth);
    }
    strokeWithEdge(ctx, color, pixelSize);

    if (solidHead) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-headLength, -headHalfWidth);
        ctx.lineTo(-headLength, headHalfWidth);
        ctx.closePath();
        ctx.lineJoin = 'miter';
        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = edgeWidth * 2 * pixelSize;
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.fill();
    }
}

/**
 * For each object tactical and science are targeting that's wholly out of view, draw an arrow just inside the edge of the view, pointing towards it,
 * in that crew's colour (with a solid head for tactical, and an open one for science), with the contact's label beside it if one is given. Anything not among the objects (e.g. out of sensor range) is skipped.
 * The context should be in world units, and not turned.
 */
export function drawOffscreenTargetArrows(
    ctx: CanvasRenderingContext2D,
    bounds: Rectangle,
    objects: Readonly<Record<string, Pick<GameObjectInfo, 'motion'>>>,
    targets: ReticleTargets,
    time: number,
    pixelSize: number,
    labels?: Readonly<Partial<Record<string, string>>>
) {
    const draw = (id: string | null | undefined, color: string, solidHead: boolean, insetPixels: number, withLabel: boolean) => {
        const object = id ? objects[id] : undefined;
        if (!id || !object) {
            return;
        }

        const position = interpolatePosition(object.motion, time);
        if (!isWhollyOffscreen(bounds, position)) {
            return;
        }

        const inset = insetPixels * pixelSize;
        const tip = getEdgePoint(bounds, position, { top: inset, right: inset, bottom: inset, left: inset });

        ctx.save();
        ctx.translate(tip.x, tip.y);
        ctx.rotate(tip.angle);
        drawArrow(ctx, color, solidHead, pixelSize);
        ctx.restore();

        const label = withLabel ? labels?.[id] : undefined;
        if (label) {
            // Written just behind the arrow, back towards the middle of the view, so it never runs off the edge.
            const back = (arrowLength + 6) * pixelSize;
            ctx.save();
            ctx.translate(tip.x - Math.cos(tip.angle) * back, tip.y - Math.sin(tip.angle) * back);
            ctx.font = `bold ${arrowLabelSize * pixelSize}px "Share Tech Mono", monospace`;
            ctx.textAlign = Math.cos(tip.angle) > 0.3 ? 'right' : Math.cos(tip.angle) < -0.3 ? 'left' : 'center';
            ctx.textBaseline = Math.sin(tip.angle) > 0.3 ? 'bottom' : Math.sin(tip.angle) < -0.3 ? 'top' : 'middle';
            ctx.lineWidth = edgeWidth * 2 * pixelSize;
            ctx.strokeStyle = edgeColor;
            ctx.strokeText(label.toUpperCase(), 0, 0);
            ctx.fillStyle = color;
            ctx.fillText(label.toUpperCase(), 0, 0);
            ctx.restore();
        }
    };

    // When both crews are after the same contact, science's arrow sits further in than tactical's, so both show, and the label is written once, behind it.
    const sameTarget = !!targets.scienceTargetId && targets.scienceTargetId === targets.tacticalTargetId;

    draw(targets.tacticalTargetId, tacticalReticleColor, true, tacticalArrowInset, !sameTarget);
    draw(targets.scienceTargetId, scienceReticleColor, false, sameTarget ? scienceArrowInset : tacticalArrowInset, true);
}

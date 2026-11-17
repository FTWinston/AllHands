import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { interpolatePosition } from 'common-data/features/space/utils/interpolate';

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

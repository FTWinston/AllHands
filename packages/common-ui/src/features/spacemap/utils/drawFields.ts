import type { DeflectorEffectSubstance } from 'common-data/features/cards/types/CardDefinition';
import type { FieldInfo } from 'common-data/features/space/types/FieldInfo';

/** The colour (as red, green and blue) that a field of each substance is tinted. */
export const fieldColors: Record<DeflectorEffectSubstance, readonly [number, number, number]> = {
    Antiproton: [255, 90, 70],
    Tetryon: [255, 200, 60],
    Chroniton: [70, 190, 255],
    Polaron: [90, 230, 130],
    Graviton: [190, 120, 255],
};

/** How long a field takes to fade out at the end of its life, in milliseconds. */
const fadeDuration = 2000;

/**
 * Draw each field as a translucent oval tinted by its substance, with an outline (dashed if it helps friendly ships), fading out as it expires.
 * Draw these before the ships, so they're seen through the oval.
 */
export function drawFields(ctx: CanvasRenderingContext2D, fields: Iterable<FieldInfo>, currentTime: number, pixelSize: number) {
    for (const field of fields) {
        const remaining = field.endTime - currentTime;
        if (remaining <= 0) {
            continue;
        }

        const [red, green, blue] = fieldColors[field.substance];
        const fade = Math.min(1, remaining / fadeDuration);

        ctx.save();
        ctx.translate(field.x, field.y);
        ctx.rotate(-field.angle);

        ctx.beginPath();
        ctx.ellipse(0, 0, field.radiusX, field.radiusY, 0, 0, Math.PI * 2);

        ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${0.18 * fade})`;
        ctx.fill();

        ctx.lineWidth = 2 * pixelSize;
        ctx.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${0.7 * fade})`;
        ctx.setLineDash(field.friendly ? [8 * pixelSize, 6 * pixelSize] : []);
        ctx.stroke();

        ctx.restore();
    }
}

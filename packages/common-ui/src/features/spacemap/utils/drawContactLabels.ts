import { GameObjectInfo, RelationshipViewer } from 'common-data/features/space/types/GameObjectInfo';
import { getDisplayRelationship } from 'common-data/features/space/utils/getDisplayRelationship';
import { interpolatePosition } from 'common-data/features/space/utils/interpolate';
import { getColors } from './relationshipColors';

/** A contact's label by object id (see `PlayerShipInfo.contactLabels`). */
export type ContactLabels = Readonly<Partial<Record<string, string>>>;

/** How far from a contact's centre its label is drawn, in world units: clear of the ship's drawing, below and to the right. */
const labelOffset = { x: 1.15, y: 0.95 };

const fontSize = 14;
const backgroundColor = 'rgba(2, 7, 12, 0.75)';

/**
 * Write each contact's label beside it, in the colour of its relationship to the viewer, on a dark plate so that it reads over anything.
 * Contacts with no label (e.g. the viewer's own ship) are skipped. The context should be in world units, and not turned.
 * `pixelSize` is how big a pixel is in those units.
 */
export function drawContactLabels(
    ctx: CanvasRenderingContext2D,
    objects: Iterable<GameObjectInfo>,
    labels: ContactLabels,
    viewer: RelationshipViewer,
    time: number,
    pixelSize: number
) {
    ctx.save();
    ctx.font = `bold ${fontSize * pixelSize}px "Share Tech Mono", monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (const object of objects) {
        const label = labels[object.id];
        if (!label) {
            continue;
        }

        const position = interpolatePosition(object.motion, time);
        const x = position.x + labelOffset.x;
        const y = position.y + labelOffset.y;
        const width = ctx.measureText(label.toUpperCase()).width;

        ctx.fillStyle = backgroundColor;
        ctx.fillRect(x - 3 * pixelSize, y - fontSize * 0.7 * pixelSize, width + 6 * pixelSize, fontSize * 1.4 * pixelSize);

        ctx.fillStyle = getColors(getDisplayRelationship(object, viewer))[1];
        ctx.fillText(label.toUpperCase(), x, y);
    }

    ctx.restore();
}

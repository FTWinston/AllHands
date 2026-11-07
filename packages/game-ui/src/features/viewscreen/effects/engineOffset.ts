import { ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';
import { getSvgBitmap } from 'common-ui/features/spacemap/utils/svgBitmapCache';
import { litShipColor } from './objectTracker';

/** How far behind a ship's center its engine glow goes, until its drawing has loaded. */
const defaultEngineOffset = 0.85;

/** How far either side of the center line to look for the back of the hull, as a fraction of the drawing's height. */
const searchBand = 0.03;

type Pixels = Pick<ImageData, 'data' | 'width' | 'height'>;

/**
 * How far behind the center the back of a ship's hull is, in a drawing that spans -1 to 1 and faces right, judging by its center line.
 * A ship with an indented back has its engine in the notch, rather than out in the space between its tails.
 */
export function findBackEdge(pixels: Pixels): number | undefined {
    const { data, width, height } = pixels;

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (data[(y * width + x) * 4 + 3] > 127) {
                return 1 - 2 * x / width;
            }
        }
    }

    return undefined;
}

const engineOffsets = new Map<ObjectAppearance, number>();

/** How far behind a ship's center its engine glow goes, so that it sits against the back of its hull. */
export function getEngineOffset(appearance: ObjectAppearance) {
    const known = engineOffsets.get(appearance);

    if (known !== undefined) {
        return known;
    }

    // Any colors would do, but the tracker has already loaded these.
    const bitmap = getSvgBitmap(appearance, litShipColor, litShipColor);

    if (!bitmap) {
        return defaultEngineOffset;
    }

    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);

    const band = Math.max(1, Math.round(bitmap.height * searchBand));
    const offset = findBackEdge(ctx.getImageData(0, Math.floor(bitmap.height / 2) - band, bitmap.width, band * 2)) ?? defaultEngineOffset;

    engineOffsets.set(appearance, offset);
    return offset;
}

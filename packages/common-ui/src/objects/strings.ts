import { isShipAppearance, type ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';
import chevronRaw from './chevron.svg?raw';
import circleRaw from './circle.svg?raw';
import { getShipDrawing } from './shipDrawings';

const coreStrings = {
    chevron: chevronRaw,
    circle: circleRaw,
};

/** The svg for the given appearance, as text: the crew's chevron, a plain circle, or a registered ship drawing. */
export function getSvgString(appearance: ObjectAppearance): string {
    if (!isShipAppearance(appearance)) {
        return coreStrings[appearance];
    }

    const drawing = getShipDrawing(appearance);
    if (!drawing) {
        throw new Error(`No ship drawing registered for appearance: ${appearance}`);
    }

    return drawing.svg;
}

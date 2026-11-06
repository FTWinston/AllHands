import { shipAppearances, type ObjectAppearance, type ShipAppearance } from 'common-data/features/space/types/ObjectAppearance';
import chevronRaw from './chevron.svg?raw';
import circleRaw from './circle.svg?raw';

/** Every ship design's file, by its name: the same as its appearance. */
const shipFiles = import.meta.glob<string>('./ships/*/*.svg', { query: '?raw', import: 'default', eager: true });

const shipStrings = Object.fromEntries(
    Object.entries(shipFiles).map(([path, raw]) => [path.replace(/^.*\/(.+)\.svg$/, '$1'), raw])
) as Partial<Record<ShipAppearance, string>>;

for (const appearance of shipAppearances) {
    if (!shipStrings[appearance]) {
        throw new Error(`No ship design file for appearance: ${appearance}`);
    }
}

export const svgStrings: Record<ObjectAppearance, string> = {
    chevron: chevronRaw,
    circle: circleRaw,
    ...shipStrings as Record<ShipAppearance, string>,
};

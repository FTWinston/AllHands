import { shipAppearances } from 'common-data/features/space/types/ObjectAppearance';
import { describe, expect, it } from 'vitest';
import { getMapSvg, type ShipMapStyle } from './mapSvg';
import { getSvgString } from './strings';

const styles: ShipMapStyle[] = ['filled', 'silhouette'];

describe('getMapSvg', () => {
    it.each(shipAppearances)('%s labels each of the groups that map styles restyle', (appearance) => {
        for (const group of ['hull', 'details', 'marks']) {
            expect(getSvgString(appearance).split(`<g class="${group}"`)).toHaveLength(2);
        }
    });

    it.each(['ring-courier', 'ring-spine-tender', 'spiked-mine', 'ring-vessel'] as const)('%s keeps its middle hollow and its structure', (appearance) => {
        expect(getSvgString(appearance)).toContain('fill-rule="evenodd"');
        expect(getSvgString(appearance)).toContain('class="structure"');
    });

    it.each(styles)('puts the %s style inside the svg', (style) => {
        expect(getMapSvg(getSvgString('dart-fighter'), 'dart-fighter', style)).toMatch(/^<svg [^>]*><style>[^<]+<\/style>[\s\S]*<\/svg>\s*$/);
    });

    it.each(styles)('leaves objects that are not ships as they are when %s', (style) => {
        expect(getMapSvg(getSvgString('chevron'), 'chevron', style)).toBe(getSvgString('chevron'));
    });
});

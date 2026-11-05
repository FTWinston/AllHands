import { shipAppearances } from 'common-data/features/space/types/ObjectAppearance';
import { describe, expect, it } from 'vitest';
import { getMapSvg } from './mapSvg';
import { svgStrings } from './strings';

describe('getMapSvg', () => {
    it.each(shipAppearances)('fills the hull of %s and leaves off its construction marks', (appearance) => {
        const svg = getMapSvg(svgStrings[appearance], appearance);
        expect(svg).toMatch(/^<svg [^>]*viewBox=/);
        expect(svg).toContain('fill="var(--highlight)"');
        expect(svg).not.toContain('stroke-dasharray');
    });

    it.each(['chevron', 'circle'] as const)('leaves %s as it is', (appearance) => {
        expect(getMapSvg(svgStrings[appearance], appearance)).toBe(svgStrings[appearance]);
    });
});

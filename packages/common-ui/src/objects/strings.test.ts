import { shipAppearances } from 'common-data/features/space/types/ObjectAppearance';
import { describe, expect, it } from 'vitest';
import { svgStrings } from './strings';

describe('svgStrings', () => {
    it.each(['chevron', 'circle', ...shipAppearances] as const)('has a drawing for %s', (appearance) => {
        expect(svgStrings[appearance]).toMatch(/^<svg [^>]*viewBox=/);
    });

    it('has no ship designs that no appearance uses', () => {
        expect(Object.keys(svgStrings).sort()).toEqual(['chevron', 'circle', ...shipAppearances].sort());
    });
});

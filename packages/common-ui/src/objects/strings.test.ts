import { shipAppearances } from 'common-data/features/space/types/ObjectAppearance';
import { describe, expect, it } from 'vitest';
import { getSvgString } from './strings';

describe('getSvgString', () => {
    it.each(['chevron', 'circle', ...shipAppearances] as const)('has a drawing for %s', (appearance) => {
        expect(getSvgString(appearance)).toMatch(/^<svg [^>]*viewBox=/);
    });
});

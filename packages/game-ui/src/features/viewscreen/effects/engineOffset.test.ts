import { describe, expect, it } from 'vitest';
import { findBackEdge } from './engineOffset';

/** A drawing of the given width and height, with the given pixels filled in. */
function makePixels(width: number, height: number, filled: Array<[number, number]>) {
    const data = new Uint8ClampedArray(width * height * 4);

    for (const [x, y] of filled) {
        data[(y * width + x) * 4 + 3] = 255;
    }

    return { data, width, height };
}

describe('findBackEdge', () => {
    it('finds the backmost filled pixel', () => {
        expect(findBackEdge(makePixels(8, 2, [[2, 0], [5, 1]]))).toBe(0.5);
    });

    it('finds a pixel in any row of the band', () => {
        expect(findBackEdge(makePixels(8, 3, [[6, 0], [4, 2]]))).toBe(0);
    });

    it('ignores faint pixels, such as antialiased edges', () => {
        const pixels = makePixels(8, 1, [[6, 0]]);
        pixels.data[3] = 40;

        expect(findBackEdge(pixels)).toBe(-0.5);
    });

    it('gives nothing for an empty band', () => {
        expect(findBackEdge(makePixels(8, 2, []))).toBeUndefined();
    });
});

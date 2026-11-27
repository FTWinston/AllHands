import { describe, expect, it } from 'vitest';
import { getEdgePoint, isWhollyOffscreen } from './drawTargetReticles';

/** The same inset on every side. */
const even = (inset: number) => ({ top: inset, right: inset, bottom: inset, left: inset });

/** A view 20 units wide and 10 tall, centred on the origin. */
const bounds = { x: -10, y: -5, width: 20, height: 10 };

describe('isWhollyOffscreen', () => {
    it('counts an object in view, or only partly out of it, as on screen', () => {
        expect(isWhollyOffscreen(bounds, { x: 0, y: 0 })).toBe(false);
        expect(isWhollyOffscreen(bounds, { x: 10.5, y: 0 })).toBe(false);
        expect(isWhollyOffscreen(bounds, { x: 0, y: -5.5 })).toBe(false);
    });

    it('counts an object whose drawing is wholly past an edge as off screen', () => {
        expect(isWhollyOffscreen(bounds, { x: 12, y: 0 })).toBe(true);
        expect(isWhollyOffscreen(bounds, { x: -12, y: 0 })).toBe(true);
        expect(isWhollyOffscreen(bounds, { x: 0, y: 7 })).toBe(true);
        expect(isWhollyOffscreen(bounds, { x: 30, y: 30 })).toBe(true);
    });
});

describe('getEdgePoint', () => {
    it('puts the point on the edge the line from the middle leaves through, brought in by the inset', () => {
        // Straight to the right: the right edge, less the inset.
        expect(getEdgePoint(bounds, { x: 50, y: 0 }, even(1))).toEqual({ x: 9, y: 0, angle: 0 });

        // Straight up: the top edge, less the inset.
        const up = getEdgePoint(bounds, { x: 0, y: -50 }, even(1));
        expect(up.x).toBeCloseTo(0);
        expect(up.y).toBeCloseTo(-4);
        expect(up.angle).toBeCloseTo(-Math.PI / 2);
    });

    it('meets whichever edge comes first along a diagonal', () => {
        // Equally far right and down: the view is wider than it's tall, so the line meets the bottom edge first.
        const point = getEdgePoint(bounds, { x: 40, y: 40 }, even(0));
        expect(point.y).toBeCloseTo(5);
        expect(point.x).toBeCloseTo(5);
        expect(point.angle).toBeCloseTo(Math.PI / 4);
    });

    it('points the way the target lies, wherever the view is', () => {
        const offset = { x: 100, y: 200, width: 20, height: 10 };
        const point = getEdgePoint(offset, { x: 50, y: 205 }, even(0));
        expect(point).toEqual({ x: 100, y: 205, angle: Math.PI });
    });

    it('keeps clear of extra room asked for along one side, such as for buttons there', () => {
        // Straight to the right, with 4 units kept clear on the right: the point stops 4 in from the right edge, and the arrow still points right.
        expect(getEdgePoint(bounds, { x: 50, y: 0 }, { top: 0, right: 4, bottom: 0, left: 0 })).toEqual({ x: 6, y: 0, angle: 0 });

        // Straight to the left, the room on the right makes no difference.
        expect(getEdgePoint(bounds, { x: -50, y: 0 }, { top: 0, right: 4, bottom: 0, left: 0 }).x).toBeCloseTo(-10);
    });
});

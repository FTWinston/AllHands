import { WeaponEffect, warpAwayWindUp } from 'common-data/features/space/types/WeaponEffect';
import { describe, expect, it, vi } from 'vitest';
import { drawWeaponEffects } from './drawWeaponEffects';

function createContext() {
    return {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
    };
}

function draw(effects: WeaponEffect[], currentTime = 750) {
    const context = createContext();
    drawWeaponEffects(context as unknown as CanvasRenderingContext2D, effects, {}, currentTime, 1);
    return context;
}

const explosion: WeaponEffect = {
    type: 'explosion',
    sourceId: 'gone',
    appearance: 'chevron',
    position: { x: 12, y: -3, angle: 0 },
    startTime: 0,
};

describe('drawWeaponEffects', () => {
    it('draws an explosion where its source was, once the source has been removed', () => {
        const context = draw([explosion]);

        expect(context.arc).toHaveBeenCalledWith(12, -3, expect.any(Number), 0, Math.PI * 2);
    });

    it('prunes effects that have finished', () => {
        const effects: WeaponEffect[] = [explosion];

        draw(effects, 100000);

        expect(effects).toEqual([]);
    });

    it('draws nothing for an impact, and prunes it', () => {
        const effects: WeaponEffect[] = [{ type: 'impact', sourceId: 'a', targetId: 'b', damage: 1, startTime: 0 }];

        const context = draw(effects);

        expect(context.stroke).not.toHaveBeenCalled();
        expect(effects).toEqual([]);
    });

    describe('a ship jumping to warp', () => {
        const warpAway: WeaponEffect = {
            type: 'warpAway',
            sourceId: 'gone',
            appearance: 'chevron',
            position: { x: 12, y: -3, angle: 0 },
            startTime: 0,
        };

        it('draws nothing while the ship gathers itself', () => {
            const context = draw([warpAway], warpAwayWindUp);

            expect(context.stroke).not.toHaveBeenCalled();
        });

        it('then draws a line from where it was, off the way it was facing', () => {
            const context = draw([warpAway], warpAwayWindUp + 200);

            expect(context.moveTo).toHaveBeenCalledWith(12, -3);
            const [x, y] = context.lineTo.mock.calls[0];
            expect(x).toBeGreaterThan(12);
            expect(y).toBeCloseTo(-3);
        });

        it('is pruned once it has finished', () => {
            const effects: WeaponEffect[] = [warpAway];

            draw(effects, 100000);

            expect(effects).toEqual([]);
        });
    });
});

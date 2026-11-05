import { WeaponEffect } from 'common-data/features/space/types/WeaponEffect';
import { describe, expect, it, vi } from 'vitest';
import { drawWeaponEffects } from './drawWeaponEffects';

function createContext() {
    return {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
    };
}

const explosion: WeaponEffect = {
    type: 'explosion',
    sourceId: 'gone',
    color: '#ff6600',
    thickness: 0.5,
    duration: 1500,
    startTime: 0,
};

function draw(effect: WeaponEffect) {
    const context = createContext();
    drawWeaponEffects(context as unknown as CanvasRenderingContext2D, [effect], {}, 750, 1, false);
    return context;
}

describe('drawWeaponEffects', () => {
    it('draws an explosion where its source was, once the source has been removed', () => {
        const context = draw({ ...explosion, sourcePosition: { x: 12, y: -3 } });

        expect(context.arc).toHaveBeenCalledWith(12, -3, expect.any(Number), 0, Math.PI * 2);
    });

    it('draws nothing for an explosion if there is no telling where it was', () => {
        const context = draw(explosion);

        expect(context.arc).not.toHaveBeenCalled();
    });
});

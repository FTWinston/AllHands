import { WeaponEffect } from 'common-data/features/space/types/WeaponEffect';
import { describe, expect, it } from 'vitest';
import { getCombatShake } from './combatShake';

function size(effects: WeaponEffect[], time = 20) {
    const { x, y } = getCombatShake(effects, 'own', { x: 0, y: 0 }, time);
    return Math.hypot(x, y);
}

const impact = (targetId: string, damage: number): WeaponEffect => ({ type: 'impact', sourceId: 'enemy', targetId, damage, startTime: 0 });

const explosion = (x: number): WeaponEffect => ({ type: 'explosion', sourceId: 'enemy', appearance: 'hammerhead-cruiser', position: { x, y: 0, angle: 0 }, startTime: 0 });

describe('getCombatShake', () => {
    it('is still with nothing going on', () => {
        expect(size([])).toBe(0);
    });

    it('ignores hits on other ships', () => {
        expect(size([impact('enemy', 10)])).toBe(0);
    });

    it('shakes more for damage than for a hit on the shields', () => {
        expect(size([impact('own', 5)])).toBeGreaterThan(size([impact('own', 0)]));
    });

    it('shakes more for nearer explosions', () => {
        expect(size([explosion(2)])).toBeGreaterThan(size([explosion(40)]));
    });

    it('settles down', () => {
        expect(size([impact('own', 5)], 5000)).toBe(0);
    });
});

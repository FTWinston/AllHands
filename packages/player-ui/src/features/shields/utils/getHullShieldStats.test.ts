import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { describe, expect, it } from 'vitest';
import { getHullShieldStats } from './getHullShieldStats';

describe('getHullShieldStats', () => {
    it('counts damaged emitters, but not damaged regenerators or delay reduction cards', () => {
        const stats = getHullShieldStats([
            { id: 1, type: 'hullShieldEmitter', extraTraits: { damaged: ExtraTraitType.Normal } },
            { id: 2, type: 'hullShieldEmitter' },
            { id: 3, type: 'hullShieldRegenerator', extraTraits: { critical: ExtraTraitType.Normal } },
            { id: 4, type: 'hullShieldRegenerator' },
            { id: 5, type: 'hullShieldDelayReduction', extraTraits: { damaged: ExtraTraitType.Normal } },
            { id: 6, type: 'hullPlating' },
        ], 2);

        expect(stats).toEqual({ capacity: 30, cardCharge: 1, charge: 3, rechargeDelay: 2 });
    });

    it('applies card modifiers', () => {
        const stats = getHullShieldStats([{ id: 1, type: 'hullShieldEmitter', modifiers: { shieldCapacity: 5 } }], 1);

        expect(stats.capacity).toBe(20);
    });

    it('gives no charge while the hull is unpowered', () => {
        const stats = getHullShieldStats([{ id: 1, type: 'hullShieldRegenerator' }], 0);

        expect(stats.charge).toBe(0);
    });
});

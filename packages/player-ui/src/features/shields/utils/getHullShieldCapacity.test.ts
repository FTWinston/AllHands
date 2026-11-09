import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { describe, expect, it } from 'vitest';
import { getHullShieldCapacity } from './getHullShieldCapacity';

describe('getHullShieldCapacity', () => {
    it('adds up the capacity of undamaged emitters, including stabilised ones', () => {
        const capacity = getHullShieldCapacity([
            { id: 1, type: 'hullShieldEmitter', extraTraits: { damaged: ExtraTraitType.Normal } },
            { id: 2, type: 'hullShieldEmitter', extraTraits: { stabilised: ExtraTraitType.Normal } },
            { id: 3, type: 'hullVolatileEmitter', extraTraits: { critical: ExtraTraitType.Normal } },
            { id: 4, type: 'hullVolatileEmitter' },
            { id: 5, type: 'hullShieldTuningEnergy' },
            { id: 6, type: 'hullPlating' },
        ]);

        expect(capacity).toBe(60);
    });

    it('applies card modifiers', () => {
        const capacity = getHullShieldCapacity([{ id: 1, type: 'hullShieldEmitter', modifiers: { shieldCapacity: 5 } }]);

        expect(capacity).toBe(20);
    });
});

import { seededRandom } from 'src/testUtils';
import { describe, expect, it } from 'vitest';
import { getSynergyCardTypes } from '../cards/cardSynergies';
import { deliveryCardCount, pickDeliveryCardTypes } from './workOrders';
import type { CardType } from 'common-data/features/cards/utils/cardDefinitions';

describe('pickDeliveryCardTypes', () => {
    // Photon torpedoes match the five cards that want a torpedo weapon.
    const matches = getSynergyCardTypes('photonTorpedo');

    it.each([1, 2, 3, 4, 5])('picks different matching types the crew member doesn\'t own (seed %i)', (seed) => {
        const picked = pickDeliveryCardTypes(seededRandom(seed), 'photonTorpedo', new Set());

        expect(picked).toHaveLength(deliveryCardCount);
        expect(new Set(picked).size).toBe(deliveryCardCount);
        for (const type of picked) {
            expect(matches).toContain(type);
        }
    });

    it.each([1, 2, 3, 4, 5])('only tops up with owned types when there aren\'t enough new ones (seed %i)', (seed) => {
        const owned = new Set<CardType>(['lowYield', 'highYield', 'fullSpread']);

        const picked = pickDeliveryCardTypes(seededRandom(seed), 'photonTorpedo', owned);

        expect(picked).toHaveLength(deliveryCardCount);
        expect(picked).toContain('extendedRange');
        expect(picked).toContain('projectileManoeuvrability');
        expect(picked.filter(type => owned.has(type))).toHaveLength(1);
    });

    it('offers fewer cards when there are fewer matches', () => {
        const picked = pickDeliveryCardTypes(seededRandom(1), 'lowYield', new Set(['photonTorpedo']));

        expect([...picked].sort()).toEqual(['photonTorpedo', 'quantumTorpedo']);
    });
});

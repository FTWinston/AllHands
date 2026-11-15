import { cardDefinitions, type CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { getCardRarity } from 'common-data/features/cards/utils/getCardRarity';
import { getShopCardTypes } from 'common-data/features/cards/utils/getShopCardTypes';
import { getShopCardPrice, shopCardPrices } from 'common-data/features/ships/utils/antimatter';
import { seededRandom } from 'src/testUtils';
import { describe, expect, it } from 'vitest';
import { pickShopCardTypes, shopCardCount } from './stationShop';
import type { CardDefinition } from 'common-data/features/cards/types/CardDefinition';
import type { CardRarity } from 'common-data/features/cards/types/CardRarity';
import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';

const roles: CrewRoleName[] = ['helm', 'science', 'tactical', 'engineer'];

function getDefinition(type: CardType): CardDefinition {
    return cardDefinitions[type] as CardDefinition;
}

describe('getShopCardTypes', () => {
    it.each(roles)('offers %s enough cards of its own, none of them expendable', (role) => {
        const types = getShopCardTypes(role);
        expect(types.length).toBeGreaterThanOrEqual(shopCardCount);

        for (const type of types) {
            const definition = getDefinition(type);
            expect(definition.system).toBe(role);
            expect(definition.traits ?? []).not.toContain('expendable');
            expect(definition.traits ?? []).not.toContain('priority');
        }
    });

    it('excludes campaign, placeholder and choice option cards', () => {
        const helm = getShopCardTypes('helm');
        expect(helm).not.toContain('warpAway');
        expect(helm).not.toContain('exampleNoTarget');
        expect(helm).not.toContain('sweepLeft');
        expect(helm).toContain('sweep');
    });

    it('never offers reactor or hull cards', () => {
        const all = roles.flatMap(getShopCardTypes);
        expect(all.some(type => getDefinition(type).system === 'reactor' || getDefinition(type).system === 'hull')).toBe(false);
    });
});

describe('pickShopCardTypes', () => {
    it.each(roles)('picks different cards that a %s shop can sell', (role) => {
        for (let seed = 1; seed <= 20; seed++) {
            const types = pickShopCardTypes(seededRandom(seed), role);
            expect(types.length).toBe(shopCardCount);
            expect(new Set(types).size).toBe(shopCardCount);
            for (const type of types) {
                expect(getShopCardTypes(role)).toContain(type);
            }
        }
    });

    it('varies what is offered', () => {
        const offers = new Set(Array.from({ length: 20 }, (_, seed) => pickShopCardTypes(seededRandom(seed + 1), 'tactical').join()));
        expect(offers.size).toBeGreaterThan(1);
    });

    it('offers rarer cards less often', () => {
        // Count how often each rarity is offered by many single-card shops, relative to how many cards of that rarity there are.
        const pool = getShopCardTypes('engineer');
        const offered: Record<CardRarity, number> = { common: 0, uncommon: 0, rare: 0 };

        for (let seed = 1; seed <= 2000; seed++) {
            const [type] = pickShopCardTypes(seededRandom(seed), 'engineer', 1);
            offered[getCardRarity(type)]++;
        }

        const perCard = (rarity: CardRarity) => offered[rarity] / pool.filter(type => getCardRarity(type) === rarity).length;

        expect(perCard('common')).toBeGreaterThan(perCard('uncommon'));
        expect(perCard('uncommon')).toBeGreaterThan(perCard('rare'));
        expect(perCard('rare')).toBeGreaterThan(0);
    });
});

describe('getShopCardPrice', () => {
    it('prices cards by rarity', () => {
        expect(getShopCardPrice('trickleCharge')).toBe(shopCardPrices.common);
        expect(getShopCardPrice('extremeMeasures')).toBe(shopCardPrices.rare);
        expect(shopCardPrices.common).toBeLessThan(shopCardPrices.uncommon);
        expect(shopCardPrices.uncommon).toBeLessThan(shopCardPrices.rare);
    });
});

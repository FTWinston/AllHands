import { cardDefinitions, type CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { getShopCardTypes } from 'common-data/features/cards/utils/getShopCardTypes';
import { seededRandom } from 'src/testUtils';
import { describe, expect, it } from 'vitest';
import { pickShopCardTypes, shopCardCount } from './stationShop';
import type { CardDefinition } from 'common-data/features/cards/types/CardDefinition';
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
});

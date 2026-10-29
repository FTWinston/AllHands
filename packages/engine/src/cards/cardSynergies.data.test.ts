import { getShopCardTypes } from 'common-data/features/cards/utils/getShopCardTypes';
import { describe, expect, it } from 'vitest';
import { getCardSynergy, type SynergyTag } from './cardSynergies';
import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';

// Checks the real card data against the tagging rules, so that work orders stay focused. These run with `npm run test:data`, not on CI.

const roles: CrewRoleName[] = ['helm', 'tactical', 'science', 'engineer'];

/** Each side of a synergy tag should have this many cards, within a crew member's shop pool. */
const minCardsPerSide = 4;
const maxCardsPerSide = 8;

describe('card synergy tags', () => {
    it.each(roles)('gives no %s card more than two tags', (role) => {
        const overTagged = getShopCardTypes(role).filter((type) => {
            const { provides, wants } = getCardSynergy(type);
            return provides.length + wants.length > 2;
        });

        expect(overTagged).toEqual([]);
    });

    it.each(roles)(`has ${minCardsPerSide}-${maxCardsPerSide} %s cards on each side of every tag it uses`, (role) => {
        const sides = new Map<SynergyTag, { provides: number; wants: number }>();

        for (const type of getShopCardTypes(role)) {
            const { provides, wants } = getCardSynergy(type);

            for (const tag of provides) {
                const counts = sides.get(tag) ?? { provides: 0, wants: 0 };
                counts.provides++;
                sides.set(tag, counts);
            }

            for (const tag of wants) {
                const counts = sides.get(tag) ?? { provides: 0, wants: 0 };
                counts.wants++;
                sides.set(tag, counts);
            }
        }

        const problems = [...sides].flatMap(([tag, counts]) => (['provides', 'wants'] as const)
            .filter(side => counts[side] < minCardsPerSide || counts[side] > maxCardsPerSide)
            .map(side => `${tag}: ${counts[side]} card(s) ${side === 'provides' ? 'provide' : 'want'} it`));

        expect(problems).toEqual([]);
    });
});

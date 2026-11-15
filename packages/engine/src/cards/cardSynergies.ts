import { cardDefinitions, type CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { getShopCardTypes } from 'common-data/features/cards/utils/getShopCardTypes';
import { isCrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { getCardDefinition } from './getEngineCardDefinition';
import type { CardSynergy, SynergyTag } from './CardSynergy';
import type { CardDefinition } from 'common-data/features/cards/types/CardDefinition';

export type { CardSynergy, SynergyTag } from './CardSynergy';

/**
 * Every synergy tag of a card type, from its engine definition's `synergy`. Untagged cards never match anything.
 * Every enabler and payoff should be tagged; generic staples can stay untagged, as they're found in the random shop.
 */
export function getCardSynergy(type: CardType): Required<CardSynergy> {
    const synergy = getCardDefinition(type).synergy;
    return { provides: synergy?.provides ?? [], wants: synergy?.wants ?? [] };
}

function overlaps(a: readonly SynergyTag[], b: readonly SynergyTag[]) {
    return a.some(tag => b.includes(tag));
}

/**
 * The card types in the pool that match the spec: those that want something the spec provides, or provide something it wants.
 * The spec's own type is never a match.
 */
export function findSynergyCardTypes<TType extends string>(spec: TType, pool: readonly TType[], getSynergy: (type: TType) => Required<CardSynergy>): TType[] {
    const specSynergy = getSynergy(spec);

    return pool.filter((type) => {
        if (type === spec) {
            return false;
        }

        const synergy = getSynergy(type);
        return overlaps(synergy.wants, specSynergy.provides) || overlaps(synergy.provides, specSynergy.wants);
    });
}

/** The cards a work order for the given spec card could deliver: those that a shop for the spec's crew member could sell, which match the spec (see `findSynergyCardTypes`). */
export function getSynergyCardTypes(spec: CardType): CardType[] {
    const { system } = cardDefinitions[spec] as CardDefinition;
    if (!isCrewRoleName(system)) {
        return [];
    }

    return findSynergyCardTypes(spec, getShopCardTypes(system), getCardSynergy);
}

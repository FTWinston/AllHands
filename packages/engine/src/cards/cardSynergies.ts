import { cardDefinitions, type CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { getShopCardTypes } from 'common-data/features/cards/utils/getShopCardTypes';
import type { CardDefinition } from 'common-data/features/cards/types/CardDefinition';
import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';

/**
 * What links cards that work well together, for work orders: a card that "wants" a tag is a good match for one that "provides" it, and vice versa.
 * Tags live only in the engine, and are never sent to clients. Extend this as cards that need new tags arrive.
 */
export type SynergyTag = 'zeroCost' | 'energyWeapon' | 'torpedoWeapon';

/** The synergy tags of one card type. Each card should have at most two in all: usually one thing it provides, and at most one it wants. */
export type CardSynergy = {
    provides?: readonly SynergyTag[];
    wants?: readonly SynergyTag[];
};

/**
 * Hand-written synergy tags, for anything that can't be derived from a card's definition (see `getCardSynergy`).
 * Every enabler and payoff should be tagged; generic staples can stay untagged, as they're found in the random shop.
 */
export const cardSynergies: Partial<Record<CardType, CardSynergy>> = {};

const weaponTags: readonly SynergyTag[] = ['energyWeapon', 'torpedoWeapon'];

function isWeaponTag(trait: string): trait is SynergyTag {
    return (weaponTags as readonly string[]).includes(trait);
}

/** The synergy tags of a card definition that come from its data: zero cost cards, weapon traits, and the weapon trait a card requires. */
export function deriveCardSynergy(definition: CardDefinition): Required<CardSynergy> {
    const provides: SynergyTag[] = (definition.traits ?? []).flatMap(trait => (isWeaponTag(trait) ? [trait] : []));
    if (definition.parameters.cost === 0) {
        provides.push('zeroCost');
    }

    const requiredWeaponTrait = 'requiredWeaponTrait' in definition ? definition.requiredWeaponTrait : undefined;
    const wants: SynergyTag[] = requiredWeaponTrait && isWeaponTag(requiredWeaponTrait) ? [requiredWeaponTrait] : [];

    return { provides, wants };
}

/** Every synergy tag of a card type: those derived from its definition, plus any hand-written ones in `cardSynergies`. */
export function getCardSynergy(type: CardType): Required<CardSynergy> {
    const derived = deriveCardSynergy(cardDefinitions[type] as CardDefinition);
    const written = cardSynergies[type];

    return {
        provides: [...new Set([...derived.provides, ...written?.provides ?? []])],
        wants: [...new Set([...derived.wants, ...written?.wants ?? []])],
    };
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

function isCrewRole(system: string): system is CrewRoleName {
    return system === 'helm' || system === 'tactical' || system === 'science' || system === 'engineer';
}

/** The cards a work order for the given spec card could deliver: those that a shop for the spec's crew member could sell, which match the spec (see `findSynergyCardTypes`). */
export function getSynergyCardTypes(spec: CardType): CardType[] {
    const { system } = cardDefinitions[spec] as CardDefinition;
    if (!isCrewRole(system)) {
        return [];
    }

    return findSynergyCardTypes(spec, getShopCardTypes(system), getCardSynergy);
}

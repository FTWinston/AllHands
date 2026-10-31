import { cardDefinitions, type CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { getShopCardTypes } from 'common-data/features/cards/utils/getShopCardTypes';
import { isCrewRoleName } from 'common-data/features/ships/types/CrewRole';
import type { CardDefinition } from 'common-data/features/cards/types/CardDefinition';

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
 * The synergy tags of each card type. Untagged cards never match anything.
 * Every enabler and payoff should be tagged; generic staples can stay untagged, as they're found in the random shop.
 */
export const cardSynergies: Partial<Record<CardType, CardSynergy>> = {
    phaserCannon: { provides: ['energyWeapon'] },
    phaserStrip: { provides: ['energyWeapon'] },
    photonicCannon: { provides: ['energyWeapon'] },
    highIntensity: { wants: ['energyWeapon'] },
    lensingEnhancement: { wants: ['energyWeapon'] },
    precisionFocus: { wants: ['energyWeapon'] },
    subCritical: { wants: ['energyWeapon'] },
    weaponOvercharge: { wants: ['energyWeapon'] },
    rapidFire: { wants: ['energyWeapon'] },
    ionicSurge: { wants: ['energyWeapon'] },

    photonTorpedo: { provides: ['torpedoWeapon'] },
    quantumTorpedo: { provides: ['torpedoWeapon'] },
    lowYield: { wants: ['torpedoWeapon'] },
    highYield: { wants: ['torpedoWeapon'] },
    extendedRange: { wants: ['torpedoWeapon'] },
    projectileManoeuvrability: { wants: ['torpedoWeapon'] },
    fullSpread: { wants: ['torpedoWeapon'] },
};

/** Every synergy tag of a card type (see `cardSynergies`). */
export function getCardSynergy(type: CardType): Required<CardSynergy> {
    const synergy = cardSynergies[type];
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

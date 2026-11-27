import { outfitBundleCount, outfitPickCount } from 'common-data/features/cards/utils/cardRewardCounts';
import { eliteSalvageRarityWeights, shopRarityWeights, standoutRarityWeights } from 'common-data/features/cards/utils/getCardRarity';
import { crewRoleNames, type CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { OutfitBundleState, RoleCardState, SalvageCardState } from '../state/CardRewardState';
import { CardState } from '../state/CardState';
import { pickShopCardTypes } from './stationShop';
import type { PlayerShip } from '../state/PlayerShip';
import type { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import type { IRandom } from 'common-data/types/IRandom';

/**
 * Salvage after a fight: a card for each crew member but the chooser, who can't benefit from it. An elite fight's salvage is more likely to be uncommon or rare.
 * Crew members with no card to offer are left out.
 */
export function createSalvage(random: IRandom, ship: PlayerShip, chooser: CrewRoleName, elite: boolean): SalvageCardState[] {
    const weights = elite ? eliteSalvageRarityWeights : shopRarityWeights;

    return crewRoleNames
        .filter(role => role !== chooser)
        .flatMap(role => pickShopCardTypes(random, role, 1, weights).map((type) => {
            const system = ship.getCrewSystem(role);
            return new SalvageCardState(role, new CardState(ship.getCardId(), type), system.maxHealth, system.maxDeckSize);
        }));
}

/** The cards a crew member chooses one of at the first sector's outfitting station, weighted like a shop's. */
export function createOutfitPicks(random: IRandom, ship: PlayerShip, role: CrewRoleName): CardState[] {
    return pickShopCardTypes(random, role, outfitPickCount).map(type => new CardState(ship.getCardId(), type));
}

/**
 * The bundles offered at an outfitting station after the first sector. Each has a card for every crew member: an uncommon or rare standout
 * for one of them, a different one in each bundle, and commons for the rest. No crew member is offered the same card type in two bundles.
 */
export function createOutfitBundles(random: IRandom, ship: PlayerShip): OutfitBundleState[] {
    const standoutRoles = [...crewRoleNames];
    random.shuffle(standoutRoles);

    const offered = new Map<CrewRoleName, Set<CardType>>(crewRoleNames.map(role => [role, new Set()]));
    const commonOnly = { common: 1, uncommon: 0, rare: 0 };

    return standoutRoles.slice(0, outfitBundleCount).map((standout) => {
        const cards = crewRoleNames.flatMap((role) => {
            const exclude = offered.get(role)!;
            // Fall back on any rarity if there's nothing of the wanted rarity left to offer.
            const [type] = pickShopCardTypes(random, role, 1, role === standout ? standoutRarityWeights : commonOnly, exclude)
                .concat(pickShopCardTypes(random, role, 1, shopRarityWeights, exclude));
            if (!type) {
                return [];
            }

            exclude.add(type);
            return [new RoleCardState(role, new CardState(ship.getCardId(), type))];
        });

        return new OutfitBundleState(standout, cards);
    });
}

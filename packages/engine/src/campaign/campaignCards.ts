import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { createRouteCardInfo } from 'common-data/features/sectors/utils/createRouteCardInfo';
import { CardState } from '../state/CardState';
import { RouteCardInfoState } from '../state/RouteCardInfoState';
import type { Ship } from '../state/Ship';
import type { RouteCardDetail } from 'common-data/features/cards/types/RouteCardInfo';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';

/** One route card per node: helm gets playable 'basic' cards, science gets 'full' cards it cannot play. */
export function createRouteHand(ship: Ship, nodes: readonly SectorNodeInfo[], detail: RouteCardDetail): CardState[] {
    return nodes.map((node) => {
        const card = new CardState(ship.getCardId(), 'route');
        card.route = new RouteCardInfoState(createRouteCardInfo(node, detail));
        if (detail === 'full') {
            card.addTrait('unplayable', ExtraTraitType.Normal);
        }
        return card;
    });
}

export function createWarpAwayCard(ship: Ship): CardState {
    return new CardState(ship.getCardId(), 'warpAway');
}

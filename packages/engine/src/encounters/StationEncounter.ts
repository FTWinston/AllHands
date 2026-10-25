import { getShopRole, isStationKind } from 'common-data/features/sectors/utils/isStationKind';
import { getPlayerShips } from 'src/utils/shipQueries';
import { createShopCards } from '../campaign/stationShop';
import { Encounter } from './Encounter';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { GameState } from 'src/state/GameState';

/**
 * No hostiles and no objective: fully repairs every player ship on arrival. A repair station is complete straight away.
 * A shop station also stocks a shop for the crew member of its role (see `getShopRole`) on every player ship,
 * and is only complete once that crew member first closes their shop (see `shopClosed`).
 */
export class StationEncounter extends Encounter {
    constructor(state: GameState, node: SectorNodeInfo) {
        super(state, { ...node, kind: isStationKind(node.kind) ? node.kind : 'repair', objective: undefined, factionId: undefined });
    }

    protected populate(): void {
        const shopRole = getShopRole(this.node.kind);

        for (const ship of getPlayerShips(this.state)) {
            ship.fullyRepair();

            if (shopRole) {
                ship.getCrewSystem(shopRole).stockShop(createShopCards(this.state.random, ship, shopRole));
            }
        }
    }

    override start(): void {
        super.start();

        if (!getShopRole(this.node.kind)) {
            this.complete();
        }
    }

    /** A shop's crew member has closed it, completing a shop station. Does nothing if it's already complete. */
    shopClosed(): void {
        this.complete();
    }
}

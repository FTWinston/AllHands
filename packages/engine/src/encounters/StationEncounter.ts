import { getShopRole, isStationKind, stationKinds } from 'common-data/features/sectors/utils/isStationKind';
import { crewRoleNames } from 'common-data/features/ships/types/CrewRole';
import { getPlayerShips } from 'src/utils/shipQueries';
import { createShopCards } from '../campaign/stationShop';
import { createDeliveryCards } from '../campaign/workOrders';
import { Encounter } from './Encounter';
import type { EncounterDefinition } from './EncounterDefinition';
import type { EncounterId, SectorNodeInfo, StationKind } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { GameState } from 'src/state/GameState';

/**
 * No hostiles and no objective: fully repairs every player ship on arrival, and is complete straight away.
 * Every crew member's pending work order is delivered here.
 * A shop station also stocks a shop for the crew member of its role (see `getShopRole`) on every player ship, and lets the others place work orders.
 */
export class StationEncounter extends Encounter {
    constructor(state: GameState, node: SectorNodeInfo) {
        super(state, { ...node, kind: isStationKind(node.kind) ? node.kind : 'repair', objective: undefined });
    }

    protected populate(): void {
        const shopRole = getShopRole(this.node.kind);

        for (const ship of getPlayerShips(this.state)) {
            ship.fullyRepair();

            for (const role of crewRoleNames) {
                const system = ship.getCrewSystem(role);

                if (system.pendingOrder) {
                    system.deliverOrder(createDeliveryCards(this.state.random, ship, system.pendingOrder, system.deck.map(card => card.type)));
                }

                if (role === shopRole) {
                    system.stockShop(createShopCards(this.state.random, ship, role));
                } else if (shopRole) {
                    system.openOrders();
                }
            }
        }
    }

    override start(): void {
        super.start();
        this.complete();
    }

    /** Dev auto win: a station is complete on arrival anyway, and still repairs ships and stocks its shop. */
    override startComplete(): void {
        this.start();
    }
}

/** The encounter for each kind of station. */
export const stationEncounterIds: Readonly<Record<StationKind, EncounterId>> = {
    repair: 'repairStation',
    navigationBeacon: 'navigationBeacon',
    armsDealer: 'armsDealer',
    salvageYard: 'salvageYard',
    researchOutpost: 'researchOutpost',
};

const stationNames: Readonly<Record<StationKind, string>> = {
    repair: 'Repair Station',
    navigationBeacon: 'Navigation Beacon',
    armsDealer: 'Arms Dealer',
    salvageYard: 'Salvage Yard',
    researchOutpost: 'Research Outpost',
};

export const stationDefinitions: readonly EncounterDefinition[] = stationKinds.map(kind => ({
    id: stationEncounterIds[kind],
    name: stationNames[kind],
    kind,
    create: (state, node) => new StationEncounter(state, node),
}));

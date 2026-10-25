import { useRoomState, type Snapshot } from '@colyseus/react';
import { getShopRole } from 'common-data/features/sectors/utils/isStationKind';
import { shopCardPrice } from 'common-data/features/ships/utils/antimatter';
import { getNodeKindLabel } from 'common-ui/features/sectors/utils/sectorLabels';
import { useCallback, useEffect, useState } from 'react';
import type { ShopModel } from '../types/ShopModel';
import type { Room } from '@colyseus/sdk';
import type { SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import type { CrewSystemInfo } from 'common-data/features/space/types/GameObjectInfo';
import type { GameState } from 'engine/state/GameState';

/**
 * Controls a crew member's shop. Returns null except at a shop station for their role.
 * Whether it's open is only known to this client: it opens on arrival, and can be closed and reopened while at the station.
 */
export function useShop(room: Room<unknown, GameState>, crew: CrewRoleName, system: Snapshot<CrewSystemInfo> | undefined, antimatter: number): ShopModel | null {
    const encounterKind = (useRoomState(room, state => state.encounterKind) ?? null) as SectorNodeKind | null;
    const available = getShopRole(encounterKind) === crew;

    const [isOpen, setOpen] = useState(available);

    // Open on arriving at the station, and close on leaving it.
    useEffect(() => {
        setOpen(available);
    }, [available]);

    const buyCard = useCallback((cardId: number) => {
        room.send('buyShopCard', { cardId });
    }, [room]);

    const openShop = useCallback(() => {
        setOpen(true);
    }, []);

    const closeShop = useCallback(() => {
        setOpen(false);
        room.send('closeShop');
    }, [room]);

    if (!available || !system || !encounterKind) {
        return null;
    }

    return {
        title: getNodeKindLabel(encounterKind),
        cards: system.shopCards,
        price: shopCardPrice,
        antimatter,
        isOpen,
        buyCard,
        openShop,
        closeShop,
    };
}

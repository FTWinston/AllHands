import { useRoomState, type Snapshot } from '@colyseus/react';
import { getShopRole } from 'common-data/features/sectors/utils/isStationKind';
import { shopCardPrice } from 'common-data/features/ships/utils/antimatter';
import { useCallback } from 'react';
import type { ShopModel } from '../types/ShopModel';
import type { Room } from '@colyseus/sdk';
import type { SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import type { CrewSystemInfo } from 'common-data/features/space/types/GameObjectInfo';
import type { GameState } from 'engine/state/GameState';

/** Controls a crew member's shop. Returns null except at a shop station for their role. */
export function useShop(room: Room<unknown, GameState>, crew: CrewRoleName, system: Snapshot<CrewSystemInfo> | undefined, antimatter: number): ShopModel | null {
    const encounterKind = (useRoomState(room, state => state.encounterKind) ?? null) as SectorNodeKind | null;
    const available = getShopRole(encounterKind) === crew;

    const buyCard = useCallback((cardId: number) => {
        room.send('buyShopCard', { cardId });
    }, [room]);

    if (!available || !system) {
        return null;
    }

    return {
        cards: system.shopCards,
        price: shopCardPrice,
        antimatter,
        buyCard,
    };
}

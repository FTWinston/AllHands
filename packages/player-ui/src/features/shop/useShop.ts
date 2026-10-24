import { useRoomState, type Snapshot } from '@colyseus/react';
import { shopCardPrice } from 'common-data/features/ships/utils/antimatter';
import { getNodeKindLabel } from 'common-ui/features/sectors/utils/sectorLabels';
import { useCallback } from 'react';
import type { ShopControl } from './ShopControl';
import type { Room } from '@colyseus/sdk';
import type { SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { CrewSystemInfo } from 'common-data/features/space/types/GameObjectInfo';
import type { GameState } from 'engine/state/GameState';

/** Controls a crew member's shop. Returns null unless it's open, which it only is at a shop station for their role, until they close it. */
export function useShop(room: Room<unknown, GameState>, system: Snapshot<CrewSystemInfo> | undefined, antimatter: number): ShopControl | null {
    const encounterKind = (useRoomState(room, state => state.encounterKind) ?? null) as SectorNodeKind | null;

    const buyCard = useCallback((cardId: number) => {
        room.send('buyShopCard', { cardId });
    }, [room]);

    const closeShop = useCallback(() => {
        room.send('closeShop');
    }, [room]);

    if (!system?.shopOpen || !encounterKind) {
        return null;
    }

    return {
        title: getNodeKindLabel(encounterKind),
        cards: system.shopCards,
        price: shopCardPrice,
        antimatter,
        buyCard,
        closeShop,
    };
}

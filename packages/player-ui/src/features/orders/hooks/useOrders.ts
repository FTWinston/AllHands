import { useRoomState, type Snapshot } from '@colyseus/react';
import { getShopRole } from 'common-data/features/sectors/utils/isStationKind';
import { getOrderPrice } from 'common-data/features/ships/utils/antimatter';
import { useCallback } from 'react';
import { isOutsideEncounter } from '../../nonEncounter/isOutsideEncounter';
import type { OrdersModel } from '../types/OrdersModel';
import type { Room } from '@colyseus/sdk';
import type { GamePhase } from 'common-data/features/sectors/types/GamePhase';
import type { SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import type { CrewSystemInfo, PlayerShipInfo } from 'common-data/features/space/types/GameObjectInfo';
import type { GameState } from 'engine/state/GameState';

/** Controls a crew member's work orders: placing one at a shop station for another crew member, and choosing a delivered card. Returns null during an encounter. */
export function useOrders(room: Room<unknown, GameState>, crew: CrewRoleName, system: Snapshot<CrewSystemInfo> | undefined, ship: Snapshot<PlayerShipInfo> | undefined): OrdersModel | null {
    const phase = (useRoomState(room, state => state.phase) ?? null) as GamePhase | null;
    const encounterKind = (useRoomState(room, state => state.encounterKind) ?? null) as SectorNodeKind | null;
    const shopRole = phase === 'encounter' ? getShopRole(encounterKind) : null;

    const previewOrder = useCallback((cardId: number) => {
        room.send('previewOrder', { cardId });
    }, [room]);

    const placeOrder = useCallback((cardId: number) => {
        room.send('placeOrder', { cardId });
    }, [room]);

    const takeDelivery = useCallback((cardId: number) => {
        room.send('takeDelivery', { cardId });
    }, [room]);

    if (!isOutsideEncounter(phase, encounterKind) || !system || !ship) {
        return null;
    }

    return {
        crew,
        canOrder: shopRole !== null && shopRole !== crew,
        price: getOrderPrice(ship.ordersPlaced ?? 0),
        antimatter: ship.antimatter ?? 0,
        deckCards: system.deck,
        orderableCardIds: system.orderableCardIds ?? [],
        pendingOrder: system.pendingOrder ?? null,
        previewCardId: system.orderPreviewCardId ?? null,
        preview: system.orderPreview ?? [],
        deliveryCards: system.deliveryCards ?? [],
        previewOrder,
        placeOrder,
        takeDelivery,
    };
}

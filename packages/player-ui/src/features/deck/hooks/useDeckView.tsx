import { useRoomState, type Snapshot } from '@colyseus/react';
import { getShopRole, isStationKind } from 'common-data/features/sectors/utils/isStationKind';
import { useCallback, useEffect, useState } from 'react';
import { isOutsideEncounter } from '../../nonEncounter/isOutsideEncounter';
import type { DeckViewModel } from '../types/DeckViewModel';
import type { Room } from '@colyseus/sdk';
import type { GamePhase } from 'common-data/features/sectors/types/GamePhase';
import type { SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { CrewSystemInfo } from 'common-data/features/space/types/GameObjectInfo';
import type { GameState } from 'engine/state/GameState';

/**
 * Controls a crew member's "my deck" view. Returns null during an encounter, where the header's deck indicator is a discard target instead.
 * Whether it's open is only known to this client. It opens automatically on arriving at a station, and closes on leaving.
 * It only opens automatically at a station without a shop, so that the shop, or the work order panel at another crew member's shop, is seen first.
 * Nor does it open while they have a work order delivery to choose from.
 * Once a delivered card is taken, it opens to show the deck with that card added.
 */
export function useDeckView(room: Room<unknown, GameState>, system: Snapshot<CrewSystemInfo> | undefined): DeckViewModel | null {
    const phase = (useRoomState(room, state => state.phase) ?? null) as GamePhase | null;
    const encounterKind = (useRoomState(room, state => state.encounterKind) ?? null) as SectorNodeKind | null;

    const atStation = phase === 'encounter' && isStationKind(encounterKind);
    const available = isOutsideEncounter(phase, encounterKind);
    const atShopStation = atStation && getShopRole(encounterKind) !== null;
    const hasDelivery = (system?.deliveryCards?.length ?? 0) > 0;
    const openOnArrival = atStation && !atShopStation && !hasDelivery;

    const [isOpen, setOpen] = useState(openOnArrival);

    // Open on arriving at a station, and close on leaving it, or on starting an encounter.
    useEffect(() => {
        setOpen(openOnArrival);
    }, [openOnArrival]);

    useEffect(() => {
        if (!available) {
            setOpen(false);
        }
    }, [available]);

    const moveCard = useCallback((cardId: number, toIndex: number) => {
        room.send('moveDeckCard', { cardId, toIndex });
    }, [room]);

    const sellCard = useCallback((cardId: number) => {
        room.send('sellDeckCard', { cardId });
    }, [room]);

    if (!available || !system) {
        return null;
    }

    return {
        cards: system.deck,
        isOpen,
        setOpen,
        atStation,
        moveCard,
        sellCard,
    };
}

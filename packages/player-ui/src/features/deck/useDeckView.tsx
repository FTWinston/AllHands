import { useRoomState, type Snapshot } from '@colyseus/react';
import { isStationKind } from 'common-data/features/sectors/utils/isStationKind';
import { useCallback, useEffect, useState } from 'react';
import { isOutsideEncounter } from '../nonEncounter/isOutsideEncounter';
import { ShopPanel } from '../shop/components/ShopPanel';
import { useShop } from '../shop/useShop';
import type { DeckViewControl } from './DeckViewControl';
import type { Room } from '@colyseus/sdk';
import type { GamePhase } from 'common-data/features/sectors/types/GamePhase';
import type { SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { CrewSystemInfo } from 'common-data/features/space/types/GameObjectInfo';
import type { GameState } from 'engine/state/GameState';

/**
 * Controls a crew member's "my deck" view. Returns null during an encounter, where the header's deck indicator is a discard target instead.
 * Away from stations, the view is only opened locally, to browse the deck.
 * At a station, the server decides whether it's open (opening it on arrival), so that it knows when each crew member has finished with their deck.
 * At a shop station for this crew member's role, their shop shows alongside the deck until they close it.
 */
export function useDeckView(room: Room<unknown, GameState>, system: Snapshot<CrewSystemInfo> | undefined, antimatter: number): DeckViewControl | null {
    const phase = (useRoomState(room, state => state.phase) ?? null) as GamePhase | null;
    const encounterKind = (useRoomState(room, state => state.encounterKind) ?? null) as SectorNodeKind | null;

    const atStation = phase === 'encounter' && isStationKind(encounterKind);
    const available = atStation || isOutsideEncounter(phase);

    const [browsing, setBrowsing] = useState(false);
    const shop = useShop(room, system, antimatter);

    // Don't reopen a browsed deck after the next encounter.
    useEffect(() => {
        if (!available || atStation) {
            setBrowsing(false);
        }
    }, [available, atStation]);

    const setOpen = useCallback((open: boolean) => {
        if (atStation) {
            room.send('setDeckViewOpen', { open });
        } else {
            setBrowsing(open);
        }
    }, [room, atStation]);

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
        isOpen: atStation ? system.deckViewOpen : browsing,
        setOpen,
        atStation,
        antimatter,
        moveCard,
        sellCard,
        aside: shop && <ShopPanel {...shop} />,
    };
}

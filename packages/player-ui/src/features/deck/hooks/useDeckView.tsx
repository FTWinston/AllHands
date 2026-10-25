import { useRoomState, type Snapshot } from '@colyseus/react';
import { getShopRole, isStationKind } from 'common-data/features/sectors/utils/isStationKind';
import { useCallback, useEffect, useState } from 'react';
import { isOutsideEncounter } from '../../nonEncounter/isOutsideEncounter';
import type { DeckViewModel } from '../types/DeckViewModel';
import type { Room } from '@colyseus/sdk';
import type { GamePhase } from 'common-data/features/sectors/types/GamePhase';
import type { SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import type { CrewSystemInfo } from 'common-data/features/space/types/GameObjectInfo';
import type { GameState } from 'engine/state/GameState';

/**
 * Controls a crew member's "my deck" view. Returns null during an encounter, where the header's deck indicator is a discard target instead.
 * Whether it's open is only known to this client. It opens automatically on arriving at a station, and closes on leaving.
 * It doesn't open automatically at a shop station for this crew member's role, as they see their shop first.
 */
export function useDeckView(room: Room<unknown, GameState>, crew: CrewRoleName, system: Snapshot<CrewSystemInfo> | undefined, antimatter: number): DeckViewModel | null {
    const phase = (useRoomState(room, state => state.phase) ?? null) as GamePhase | null;
    const encounterKind = (useRoomState(room, state => state.encounterKind) ?? null) as SectorNodeKind | null;

    const atStation = phase === 'encounter' && isStationKind(encounterKind);
    const available = isOutsideEncounter(phase, encounterKind);
    const hasShop = atStation && getShopRole(encounterKind) === crew;
    const openOnArrival = atStation && !hasShop;

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
        antimatter: hasShop ? antimatter : null,
        moveCard,
        sellCard,
    };
}

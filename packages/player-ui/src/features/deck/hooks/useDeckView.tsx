import { useRoomState, type Snapshot } from '@colyseus/react';
import { getShopRole, isStationKind } from 'common-data/features/sectors/utils/isStationKind';
import { getStationDepartureNote } from 'common-ui/features/sectors/utils/stationDepartureLabels';
import { useCallback, useEffect, useState } from 'react';
import { isOutsideEncounter } from '../../nonEncounter/isOutsideEncounter';
import { ShopPanel } from '../../shop/components/ShopPanel';
import { useShop } from '../../shop/hooks/useShop';
import type { DeckViewModel } from '../types/DeckViewModel';
import type { Room } from '@colyseus/sdk';
import type { GamePhase } from 'common-data/features/sectors/types/GamePhase';
import type { SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import type { CrewSystemInfo, PlayerShipInfo } from 'common-data/features/space/types/GameObjectInfo';
import type { GameState } from 'engine/state/GameState';

/**
 * Controls a crew member's "my deck" view. Returns null during an encounter, where the header's deck indicator is a discard target instead.
 * Whether it's open is only known to this client. It opens automatically on arriving at a station, and closes on leaving.
 * At a shop station for this crew member's role, their shop shows alongside the deck until they close it.
 * At a station, it also notes what's holding up departure, e.g. who the crew are waiting on to finish shopping.
 */
export function useDeckView(room: Room<unknown, GameState>, crew: CrewRoleName, ship: Snapshot<PlayerShipInfo> | undefined): DeckViewModel | null {
    const system = ship?.[crewSystemKeys[crew]] as Snapshot<CrewSystemInfo> | undefined;
    const antimatter = ship?.antimatter ?? 0;
    const phase = (useRoomState(room, state => state.phase) ?? null) as GamePhase | null;
    const encounterKind = (useRoomState(room, state => state.encounterKind) ?? null) as SectorNodeKind | null;

    const atStation = phase === 'encounter' && isStationKind(encounterKind);
    const available = atStation || isOutsideEncounter(phase);

    const [isOpen, setOpen] = useState(atStation);
    const shop = useShop(room, system, antimatter);

    // Open on arriving at a station, and close on leaving it, or on starting an encounter.
    useEffect(() => {
        setOpen(atStation);
    }, [atStation]);

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
        antimatter,
        moveCard,
        sellCard,
        notice: atStation ? getStationDepartureNote(ship?.stationDeparture, getShopRole(encounterKind), crew) : null,
        aside: shop && <ShopPanel {...shop} />,
    };
}

const crewSystemKeys = {
    helm: 'helmState',
    science: 'scienceState',
    tactical: 'tacticalState',
    engineer: 'engineerState',
} as const satisfies Record<CrewRoleName, keyof PlayerShipInfo>;

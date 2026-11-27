import { useCallback } from 'react';
import type { SalvageModel } from '../types/RewardsModel';
import type { Snapshot } from '@colyseus/react';
import type { Room } from '@colyseus/sdk';
import type { SalvageCardInfo } from 'common-data/features/cards/types/CardRewardInfo';
import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import type { PlayerShipInfo } from 'common-data/features/space/types/GameObjectInfo';
import type { GameState } from 'engine/state/GameState';

/** Controls the salvage from a fight, on the map, for the crew member who chooses which card the ship takes. Returns null for everyone else, and when there's none. */
export function useSalvage(room: Room<unknown, GameState>, crew: CrewRoleName, ship: Snapshot<PlayerShipInfo> | undefined): SalvageModel | null {
    const takeSalvage = useCallback((cardId: number) => {
        room.send('takeSalvage', { cardId });
    }, [room]);

    const scrapSalvage = useCallback(() => {
        room.send('scrapSalvage');
    }, [room]);

    const hideSalvage = useCallback((hidden: boolean) => {
        room.send('hideSalvage', { hidden });
    }, [room]);

    const cards = (ship?.salvage ?? []) as Snapshot<SalvageCardInfo[]>;
    if (ship?.salvageChooser !== crew || cards.length === 0) {
        return null;
    }

    return { cards, takeSalvage, scrapSalvage, hideSalvage };
}

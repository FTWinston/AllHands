import { useRoomState } from '@colyseus/react';
import { GameEndedDisplay } from 'common-ui/components/GameEndedDisplay';
import { Screen } from 'common-ui/components/Screen';
import { FC } from 'react';
import type { Room } from '@colyseus/sdk';
import type { GameOutcome } from 'common-data/features/sectors/types/GamePhase';
import type { SectorMessageInfo } from 'common-data/features/sectors/types/SectorMessageInfo';
import type { GameState } from 'engine/state/GameState';

type Props = {
    room: Room<unknown, GameState>;
};

/** What a crew member sees once the game is over. Their station needs a ship, which they might no longer have. */
export const CrewGameEnded: FC<Props> = ({ room }) => {
    const outcome = (useRoomState(room, state => state.outcome) ?? null) as GameOutcome | null;
    // Snapshots are plain objects, so the shared info interface describes this.
    const message = (useRoomState(room, state => state.message) ?? null) as unknown as SectorMessageInfo | null;

    return (
        <Screen>
            <GameEndedDisplay outcome={outcome} message={message} />
        </Screen>
    );
};

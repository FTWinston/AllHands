import { Room } from '@colyseus/sdk';
import { useCallback, useEffect, useState } from 'react';
import type { CardRangeCommand, CardRangeInfo } from 'common-data/features/cards/types/CardRangeInfo';
import type { GameState } from 'engine/state/GameState';

/** The dev tools' card range: what the server says of it, which it sends whenever that changes, and a way to tell it what to do. */
export function useCardRange(room: Room<unknown, GameState>) {
    const [info, setInfo] = useState<CardRangeInfo | null>(null);

    useEffect(() => {
        const unsubscribe = room.onMessage<CardRangeInfo>('cardRange', setInfo);

        // It was sent on joining, before this was listening, so ask again.
        room.send('devCardRangeInfo');

        return unsubscribe;
    }, [room]);

    const send = useCallback((command: CardRangeCommand) => {
        room.send('devCardRange', command);
    }, [room]);

    return [info, send] as const;
}

import { Room } from 'colyseus.js';
import { Screen } from 'common-ui/components/Screen';
import { ITimeSynchronizer } from 'common-ui/types/ITimeSynchronizer';
import { FC } from 'react';

interface GameProps {
    room: Room;
    timeSynchronizer: ITimeSynchronizer;
    crewID: string;
    disconnect: () => void;
}

export const Game: FC<GameProps> = () => {
    return <Screen>This is your in-progress game</Screen>;
};

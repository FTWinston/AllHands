import { Room } from 'colyseus.js';
import { ITimeProvider } from 'common-data/types/ITimeProvider';
import { Screen } from 'common-ui/components/Screen';
import { FC } from 'react';

interface GameProps {
    room: Room;
    timeProvider: ITimeProvider;
    crewID: string;
    disconnect: () => void;
}

export const Game: FC<GameProps> = () => {
    return <Screen>This is your in-progress game</Screen>;
};

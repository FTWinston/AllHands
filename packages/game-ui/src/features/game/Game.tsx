import { Room } from 'colyseus.js';
import { Screen } from 'common-ui/Screen';
import { FC } from 'react';

interface GameProps {
    room: Room;
    crewID: string;
    disconnect: () => void;
}

export const Game: FC<GameProps> = () => {
    return <Screen>This is your in-progress game</Screen>;
};

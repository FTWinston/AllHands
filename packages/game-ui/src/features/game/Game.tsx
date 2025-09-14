import React from 'react';
import { Room } from 'colyseus.js';
import { Screen } from 'common-ui';

interface GameProps {
    room: Room;
    crewID: string;
    disconnect: () => void;
}

export const Game: React.FC<GameProps> = () => {
    return <Screen>This is your in-progress game</Screen>;
};

import { Room } from 'colyseus.js';
import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ITimeProvider } from 'common-data/features/space/types/ITimeProvider';
import { Keyframes } from 'common-data/features/space/types/Keyframes';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { FC, useState } from 'react';
import { GameDisplay } from './components/GameDisplay';

interface GameProps {
    room: Room;
    timeProvider: ITimeProvider;
    crewID: string;
    showMenu: () => void;
}

export const Game: FC<GameProps> = (props) => {
    const [center] = useState<Keyframes<Vector2D>>([{ time: 0, x: 0, y: 0 }]);
    const [objects] = useState<GameObjectInfo[]>([]);

    return (
        <GameDisplay
            center={center}
            timeProvider={props.timeProvider}
            objects={objects}
            showMenu={props.showMenu}
        />
    );
};

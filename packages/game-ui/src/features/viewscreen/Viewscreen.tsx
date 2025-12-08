import { ITimeProvider } from 'common-data/features/space/types/ITimeProvider';
import { Keyframes } from 'common-data/features/space/types/Keyframes';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { useGameObjects } from 'common-ui/hooks/useGameObjects';
import { FC, useState } from 'react';
import { ViewscreenDisplay } from './components/ViewscreenDisplay';
import type { Room } from 'colyseus.js';
import type { GameState } from 'engine/classes/state/GameState';

type Props = {
    room: Room<GameState>;
    timeProvider: ITimeProvider;
    crewID: string;
    showMenu: () => void;
};

export const Viewscreen: FC<Props> = (props) => {
    const objects = useGameObjects(props.room);
    const [center] = useState<Keyframes<Vector2D>>([{ time: 0, x: 0, y: 0 }]);

    return (
        <ViewscreenDisplay
            center={center}
            timeProvider={props.timeProvider}
            objects={objects}
            showMenu={props.showMenu}
        />
    );
};

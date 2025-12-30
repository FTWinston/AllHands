import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ITimeProvider } from 'common-data/features/space/types/ITimeProvider';
import { Keyframes } from 'common-data/features/space/types/Keyframes';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { useRoomState } from 'common-ui/features/useRoomState/utils/useRoomState';
import { FC } from 'react';
import { ViewscreenDisplay } from './components/ViewscreenDisplay';
import type { Room } from 'colyseus.js';
import type { GameState } from 'engine/state/GameState';

type Props = {
    room: Room<GameState>;
    timeProvider: ITimeProvider;
    shipId: string;
    showMenu: () => void;
};

const defaultCenter: Keyframes<Vector2D> = [{ time: 0, x: 0, y: 0 }];

export const Viewscreen: FC<Props> = (props) => {
    const objects = useRoomState(props.room, state => state.objects) as Record<string, GameObjectInfo>;
    const localShip = objects[props.shipId];

    return (
        <ViewscreenDisplay
            center={localShip ? localShip.motion : defaultCenter}
            timeProvider={props.timeProvider}
            objects={objects}
            showMenu={props.showMenu}
        />
    );
};

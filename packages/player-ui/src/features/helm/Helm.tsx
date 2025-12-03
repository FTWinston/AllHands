import { Room } from 'colyseus.js';
import { CardInstance, GameObjectInfo, ITimeProvider, Keyframes, Vector2D } from 'common-types';
import { useState } from 'react';
import { HelmDisplay } from './components/HelmDisplay';

type Props = {
    room: Room;
    timeProvider: ITimeProvider;
};

export const Helm = (props: Props) => {
    const [cards] = useState<CardInstance[]>([]);
    const [center] = useState<Keyframes<Vector2D>>([{ time: 0, val: { x: 0, y: 0 } }]);
    const [objects] = useState<GameObjectInfo[]>([]);

    return (
        <HelmDisplay
            cards={cards}
            onPause={() => console.log('pause please')}
            timeProvider={props.timeProvider}
            center={center}
            objects={objects}
        />
    );
};

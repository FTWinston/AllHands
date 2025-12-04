import { Room } from 'colyseus.js';
import { CardInstance } from 'common-data/types/CardInstance';
import { GameObjectInfo } from 'common-data/types/GameObjectInfo';
import { ITimeProvider } from 'common-data/types/ITimeProvider';
import { Keyframes } from 'common-data/types/Keyframes';
import { Vector2D } from 'common-data/types/Vector2D';
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
    const [power] = useState<number>(2);
    const [maxPower] = useState<number>(5);
    const [handSize] = useState<number>(2);
    const [maxHandSize] = useState<number>(5);
    const [priority, setPriority] = useState<'hand' | 'power'>('hand');

    return (
        <HelmDisplay
            cards={cards}
            onPause={() => console.log('pause please')}
            timeProvider={props.timeProvider}
            center={center}
            objects={objects}
            power={power}
            maxPower={maxPower}
            handSize={handSize}
            maxHandSize={maxHandSize}
            playCard={() => {}}
            priority={priority}
            setPriority={setPriority}
        />
    );
};

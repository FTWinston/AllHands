import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ITimeProvider } from 'common-data/features/space/types/ITimeProvider';
import { Keyframes } from 'common-data/features/space/types/Keyframes';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { useState } from 'react';
import { HelmDisplay } from './components/HelmDisplay';
import type { Room } from 'colyseus.js';
import type { GameState } from 'engine/classes/state/GameState';

type Props = {
    room: Room<GameState>;
    timeProvider: ITimeProvider;
};

export const Helm = (props: Props) => {
    const [cards] = useState<CardInstance[]>([]);
    const [center] = useState<Keyframes<Vector2D>>([{ time: 0, x: 0, y: 0 }]);
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

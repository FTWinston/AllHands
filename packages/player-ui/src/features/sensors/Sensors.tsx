import { Room } from 'colyseus.js';
import { CardInstance } from 'common-types';
import { useState } from 'react';
import { SensorsDisplay } from './components/SensorsDisplay';

type Props = {
    room: Room;
};

export const Sensors = (props: Props) => {
    const [cards] = useState<CardInstance[]>([]);

    return (
        <SensorsDisplay
            cards={cards}
            onPause={() => console.log('pause please')}
        />
    );
};

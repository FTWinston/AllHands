import { Room } from 'colyseus.js';
import { SensorsDisplay } from './SensorsDisplay';
import { CardProps } from 'common-ui/Card';
import { useState } from 'react';

type Props = {
    room: Room;
};

export const Sensors = (props: Props) => {
    const [cards] = useState<CardProps[]>([]);

    return (
        <SensorsDisplay
            cards={cards}
            onPause={() => console.log('pause please')}
        />
    );
};

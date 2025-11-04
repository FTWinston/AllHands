import { Room } from 'colyseus.js';
import { CardInstance } from 'common-types';
import { useState } from 'react';
import { EngineerDisplay } from './components/EngineerDisplay';

type Props = {
    room: Room;
};

export const Engineer = (props: Props) => {
    const [cards] = useState<CardInstance[]>([]);

    return (
        <EngineerDisplay
            cards={cards}
            onPause={() => console.log('pause please')}
        />
    );
};

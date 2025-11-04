import { Room } from 'colyseus.js';
import { CardInstance } from 'common-types';
import { useState } from 'react';
import { TacticalDisplay } from './components/TacticalDisplay';

type Props = {
    room: Room;
};

export const Tactical = (props: Props) => {
    const [cards] = useState<CardInstance[]>([]);

    return (
        <TacticalDisplay
            cards={cards}
            onPause={() => console.log('pause please')}
        />
    );
};

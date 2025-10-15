import { Room } from 'colyseus.js';
import { CardProps } from 'common-ui/Card';
import { useState } from 'react';
import { TacticalDisplay } from './components/TacticalDisplay';

type Props = {
    room: Room;
};

export const Tactical = (props: Props) => {
    const [cards] = useState<CardProps[]>([]);

    return (
        <TacticalDisplay
            cards={cards}
            onPause={() => console.log('pause please')}
        />
    );
};

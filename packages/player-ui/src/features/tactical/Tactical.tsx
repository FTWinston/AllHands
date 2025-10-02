import { Room } from 'colyseus.js';
import { TacticalDisplay } from './TacticalDisplay';
import { useState } from 'react';
import { CardProps } from 'common-ui/Card';

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

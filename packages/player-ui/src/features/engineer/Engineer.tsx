import { Room } from 'colyseus.js';
import { EngineerDisplay } from './EngineerDisplay';
import { useState } from 'react';
import { CardProps } from 'common-ui/Card';

type Props = {
    room: Room;
};

export const Engineer = (props: Props) => {
    const [cards] = useState<CardProps[]>([]);

    return (
        <EngineerDisplay
            cards={cards}
            onPause={() => console.log('pause please')}
        />
    );
};

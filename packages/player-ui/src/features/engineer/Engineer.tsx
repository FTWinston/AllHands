import { Room } from 'colyseus.js';
import { CardProps } from 'common-ui/Card';
import { useState } from 'react';
import { EngineerDisplay } from './EngineerDisplay';

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

import { Room } from 'colyseus.js';
import { CardInstance } from 'common-types';
import { useState } from 'react';
import { HelmDisplay } from './components/HelmDisplay';

type Props = {
    room: Room;
};

export const Helm = (props: Props) => {
    const [cards] = useState<CardInstance[]>([]);

    return (
        <HelmDisplay
            cards={cards}
            onPause={() => console.log('pause please')}
        />
    );
};

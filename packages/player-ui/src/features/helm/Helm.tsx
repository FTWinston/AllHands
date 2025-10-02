import { Room } from 'colyseus.js';
import { CardProps } from 'common-ui/Card';
import { useState } from 'react';
import { HelmDisplay } from './HelmDisplay';

type Props = {
    room: Room;
};

export const Helm = (props: Props) => {
    const [cards] = useState<CardProps[]>([]);

    return (
        <HelmDisplay
            cards={cards}
            onPause={() => console.log('pause please')}
        />
    );
};

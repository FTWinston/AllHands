import { Room } from 'colyseus.js';
import { HelmDisplay } from './HelmDisplay';
import { useState } from 'react';
import { CardProps } from 'common-ui/Card';

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

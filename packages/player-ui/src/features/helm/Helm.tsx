import { Room } from 'colyseus.js';
import { CardInstance } from 'common-types';
import { ITimeSynchronizer } from 'common-ui/types/ITimeSynchronizer';
import { useState } from 'react';
import { HelmDisplay } from './components/HelmDisplay';

type Props = {
    room: Room;
    timeSynchronizer: ITimeSynchronizer;
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

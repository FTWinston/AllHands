import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { useGameObjects } from 'common-ui/hooks/useGameObjects';
import { useState } from 'react';
import { SensorsDisplay } from './components/SensorsDisplay';
import type { Room } from 'colyseus.js';
import type { GameState } from 'engine/classes/state/GameState';

type Props = {
    room: Room<GameState>;
    shipId: string;
};

export const Sensors = (props: Props) => {
    const objects = useGameObjects(props.room);
    const [cards] = useState<CardInstance[]>([]);
    const [power] = useState<number>(2);
    const [maxPower] = useState<number>(5);
    const [handSize] = useState<number>(2);
    const [maxHandSize] = useState<number>(5);
    const [priority, setPriority] = useState<'hand' | 'power'>('hand');

    console.log(`Render sees ${objects.length} objects`);

    return (
        <SensorsDisplay
            cards={cards}
            onPause={() => console.log('pause please')}
            power={power}
            maxPower={maxPower}
            handSize={handSize}
            maxHandSize={maxHandSize}
            playCard={() => {}}
            priority={priority}
            setPriority={setPriority}
        />
    );
};

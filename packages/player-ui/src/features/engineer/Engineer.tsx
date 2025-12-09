import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { useGameObjects } from 'common-ui/hooks/useGameObjects';
import { useState } from 'react';
import { EngineerDisplay } from './components/EngineerDisplay';
import { SystemInfo } from './components/System';
import type { Room } from 'colyseus.js';
import type { GameState } from 'engine/classes/state/GameState';

type Props = {
    room: Room<GameState>;
    shipId: string;
};

export const Engineer = (props: Props) => {
    const [objects, _localShip] = useGameObjects(props.room, props.shipId);
    const [cards] = useState<CardInstance[]>([]);
    const [power] = useState<number>(2);
    const [maxPower] = useState<number>(5);
    const [handSize] = useState<number>(2);
    const [maxHandSize] = useState<number>(5);
    const [priority, setPriority] = useState<'hand' | 'power'>('hand');
    const [systems] = useState<SystemInfo[]>([]);

    console.log(`Render sees ${objects.length} objects`);

    return (
        <EngineerDisplay
            cards={cards}
            systems={systems}
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

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
    const [_objects, localShip] = useGameObjects(props.room, props.shipId);
    const [systems] = useState<SystemInfo[]>([]);

    if (!localShip?.engineerState) {
        return <div>unable to load</div>;
    }

    const engineerState = localShip.engineerState;

    return (
        <EngineerDisplay
            cards={engineerState.hand}
            systems={systems}
            onPause={() => console.log('pause please')}
            energy={engineerState.energy}
            maxPower={engineerState.powerLevel}
            maxHandSize={engineerState.health}
            playCard={() => {}}
            priority={engineerState.priority}
            setPriority={() => {}}
        />
    );
};

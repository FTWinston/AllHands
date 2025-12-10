import { useGameObjects } from 'common-ui/hooks/useGameObjects';
import { SensorsDisplay } from './components/SensorsDisplay';
import type { Room } from 'colyseus.js';
import type { GameState } from 'engine/classes/state/GameState';

type Props = {
    room: Room<GameState>;
    shipId: string;
};

export const Sensors = (props: Props) => {
    const [_objects, localShip] = useGameObjects(props.room, props.shipId);

    if (!localShip?.sensorState) {
        return <div>unable to load</div>;
    }

    const sensorState = localShip.sensorState;

    return (
        <SensorsDisplay
            cards={sensorState.hand}
            onPause={() => console.log('pause please')}
            energy={sensorState.energy}
            maxPower={sensorState.powerLevel}
            maxHandSize={sensorState.health}
            playCard={() => {}}
            priority={sensorState.priority}
            setPriority={() => {}}
        />
    );
};

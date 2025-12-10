import { ITimeProvider } from 'common-data/features/space/types/ITimeProvider';
import { useGameObjects } from 'common-ui/hooks/useGameObjects';
import { HelmDisplay } from './components/HelmDisplay';
import type { Room } from 'colyseus.js';
import type { GameState } from 'engine/classes/state/GameState';

type Props = {
    room: Room<GameState>;
    shipId: string;
    timeProvider: ITimeProvider;
};

export const Helm = (props: Props) => {
    const [objects, localShip] = useGameObjects(props.room, props.shipId);

    if (!localShip?.helmState) {
        return <div>unable to load</div>;
    }

    const helmState = localShip.helmState;

    return (
        <HelmDisplay
            cards={helmState.hand}
            onPause={() => console.log('pause please')}
            timeProvider={props.timeProvider}
            center={localShip.motion}
            objects={objects}
            energy={helmState.energy}
            maxPower={helmState.powerLevel}
            maxHandSize={helmState.health}
            playCard={() => {}}
            priority={helmState.priority}
            setPriority={() => {}}
        />
    );
};

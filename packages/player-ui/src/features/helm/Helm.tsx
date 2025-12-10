import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { SystemPowerPriority } from 'common-data/features/space/types/GameObjectInfo';
import { ITimeProvider } from 'common-data/features/space/types/ITimeProvider';
import { useGameObjects } from 'common-ui/hooks/useGameObjects';
import { useCallback } from 'react';
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

    const pause = useCallback(() => {
        props.room.send('pause');
    }, [props.room]);

    const playCard = useCallback((cardId: number, targetType: CardTargetType, targetId: string) => {
        props.room.send('playCard', {
            cardId,
            targetType,
            targetId,
        });
    }, [props.room]);

    const setPriority = useCallback((priority: SystemPowerPriority) => {
        props.room.send('setPriority', {
            priority,
        });
    }, [props.room]);

    if (!localShip?.helmState) {
        return <div>unable to load</div>;
    }

    const helmState = localShip.helmState;

    return (
        <HelmDisplay
            cards={helmState.hand}
            onPause={pause}
            timeProvider={props.timeProvider}
            center={localShip.motion}
            objects={objects}
            energy={helmState.energy}
            maxPower={helmState.powerLevel}
            maxHandSize={helmState.health}
            playCard={playCard}
            priority={helmState.priority}
            setPriority={setPriority}
        />
    );
};

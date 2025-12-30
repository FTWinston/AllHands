import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { GameObjectInfo, ShipInfo, SystemPowerPriority } from 'common-data/features/space/types/GameObjectInfo';
import { useRoomState } from 'common-ui/features/useRoomState/utils/useRoomState';
import { useCallback } from 'react';
import { SensorsDisplay } from './components/SensorsDisplay';
import type { Room } from 'colyseus.js';
import type { GameState } from 'engine/state/GameState';

type Props = {
    room: Room<GameState>;
    shipId: string;
};

export const Sensors = (props: Props) => {
    const objects = useRoomState(props.room, state => state.objects) as Record<string, GameObjectInfo>;
    const localShip = objects[props.shipId] as ShipInfo;

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

    if (!localShip?.sensorState) {
        return <div>unable to load</div>;
    }

    const sensorState = localShip.sensorState;

    return (
        <SensorsDisplay
            cards={sensorState.hand}
            onPause={pause}
            energy={sensorState.energy}
            maxPower={sensorState.powerLevel}
            maxHandSize={sensorState.health}
            playCard={playCard}
            priority={sensorState.priority}
            setPriority={setPriority}
            cardGeneration={sensorState.cardGeneration[0]}
            powerGeneration={sensorState.powerGeneration[0]}
        />
    );
};

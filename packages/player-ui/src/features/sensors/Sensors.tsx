import { useRoomState } from '@colyseus/react';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { GameObjectInfo, ShipInfo } from 'common-data/features/space/types/GameObjectInfo';
import { useCallback } from 'react';
import { SensorsDisplay } from './components/SensorsDisplay';
import type { Room } from '@colyseus/sdk';
import type { GameState } from 'engine/state/GameState';

type Props = {
    room: Room<{ state: GameState }>;
    shipId: string;
};

export const Sensors = (props: Props) => {
    const objects = useRoomState(props.room, state => state.objects) as Record<string, GameObjectInfo>;
    const localShip = objects[props.shipId] as ShipInfo;

    const pause = useCallback(() => {
        props.room.send('pause');
    }, [props.room]);

    const playCard = useCallback((cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string) => {
        props.room.send('playCard', {
            cardId,
            cardType,
            targetType,
            targetId,
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
            power={sensorState.powerLevel}
            maxHandSize={sensorState.health}
            playCard={playCard}
            cardGeneration={sensorState.cardGeneration[0]}
        />
    );
};

import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { GameObjectInfo, ShipInfo } from 'common-data/features/space/types/GameObjectInfo';
import { useRoomState } from 'common-ui/features/useRoomState/utils/useRoomState';
import { useCallback, useState } from 'react';
import { EngineerDisplay } from './components/EngineerDisplay';
import { SystemInfo } from './components/System';
import type { Room } from 'colyseus.js';
import type { GameState } from 'engine/state/GameState';

type Props = {
    room: Room<GameState>;
    shipId: string;
};

export const Engineer = (props: Props) => {
    const objects = useRoomState(props.room, state => state.objects) as Record<string, GameObjectInfo>;
    const localShip = objects[props.shipId] as ShipInfo;
    const [systems] = useState<SystemInfo[]>([]);

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

    if (!localShip?.engineerState) {
        return <div>unable to load</div>;
    }

    const engineerState = localShip.engineerState;

    return (
        <EngineerDisplay
            cards={engineerState.hand}
            systems={systems}
            onPause={pause}
            power={engineerState.powerLevel}
            maxHandSize={engineerState.health}
            playCard={playCard}
            cardGeneration={engineerState.cardGeneration[0]}
        />
    );
};

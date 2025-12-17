import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { GameObjectInfo, ShipInfo, SystemPowerPriority } from 'common-data/features/space/types/GameObjectInfo';
import { useImmutableRoomState } from 'common-ui/hooks/useImmutableRoomState';
import { useCallback, useState } from 'react';
import { EngineerDisplay } from './components/EngineerDisplay';
import { SystemInfo } from './components/System';
import type { Room } from 'colyseus.js';
import type { GameState } from 'engine/classes/state/GameState';

type Props = {
    room: Room<GameState>;
    shipId: string;
};

export const Engineer = (props: Props) => {
    const state = useImmutableRoomState(props.room);
    const objects = state.objects as Record<string, GameObjectInfo>;
    const localShip = objects[props.shipId] as ShipInfo;
    const [systems] = useState<SystemInfo[]>([]);

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

    if (!localShip?.engineerState) {
        return <div>unable to load</div>;
    }

    const engineerState = localShip.engineerState;

    return (
        <EngineerDisplay
            cards={engineerState.hand}
            systems={systems}
            onPause={pause}
            energy={engineerState.energy}
            maxPower={engineerState.powerLevel}
            maxHandSize={engineerState.health}
            playCard={playCard}
            priority={engineerState.priority}
            setPriority={setPriority}
            cardGeneration={engineerState.cardGeneration[0]}
            powerGeneration={engineerState.powerGeneration[0]}
        />
    );
};

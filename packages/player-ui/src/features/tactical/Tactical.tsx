import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { GameObjectInfo, ShipInfo, SystemPowerPriority } from 'common-data/features/space/types/GameObjectInfo';
import { useImmutableRoomState } from 'common-ui/hooks/useImmutableRoomState';
import { useCallback, useState } from 'react';
import { SlotPropsNoTarget, TacticalDisplay } from './components/TacticalDisplay';
import { ListTargetInfo } from './components/TargetList';
import type { Room } from 'colyseus.js';
import type { GameState } from 'engine/classes/state/GameState';

type Props = {
    room: Room<GameState>;
    shipId: string;
};

export const Tactical = (props: Props) => {
    const objects = useImmutableRoomState(props.room, state => state.objects) as Record<string, GameObjectInfo>;
    const localShip = objects[props.shipId] as ShipInfo;
    const [slots] = useState<SlotPropsNoTarget[]>([]);
    const [targets] = useState<ListTargetInfo[]>([]);

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

    if (!localShip?.tacticalState) {
        return <div>unable to load</div>;
    }

    const tacticalState = localShip.tacticalState;

    return (
        <TacticalDisplay
            cards={tacticalState.hand}
            slots={slots}
            targets={targets}
            onPause={pause}
            slotDeactivated={() => {}}
            slotFired={() => {}}
            energy={tacticalState.energy}
            maxPower={tacticalState.powerLevel}
            maxHandSize={tacticalState.health}
            playCard={playCard}
            priority={tacticalState.priority}
            setPriority={setPriority}
            cardGeneration={tacticalState.cardGeneration[0]}
            powerGeneration={tacticalState.powerGeneration[0]}
        />
    );
};

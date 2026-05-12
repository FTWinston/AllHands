import { useRoomState } from '@colyseus/react';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { GameObjectInfo, ObjectId, ShipInfo, TacticalSystemClientInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ITimeProvider } from 'common-data/features/space/types/ITimeProvider';
import { useCallback, useRef } from 'react';
import { TacticalDisplay } from './components/TacticalDisplay';
import type { Room } from '@colyseus/sdk';
import type { GameState } from 'engine/state/GameState';

type Props = {
    room: Room<{ state: GameState }>;
    shipId: string;
    timeProvider: ITimeProvider;
};

function useStableOrderedTargets(objects: Record<string, GameObjectInfo>, localShip: ShipInfo): GameObjectInfo[] {
    const insertionOrder = useRef<ObjectId[]>([]);
    const allTargets = Object.values(objects).filter(obj => obj !== localShip);

    for (const obj of allTargets) {
        if (!insertionOrder.current.includes(obj.id)) {
            insertionOrder.current.push(obj.id);
        }
    }

    return allTargets.sort(
        (a, b) => insertionOrder.current.indexOf(a.id) - insertionOrder.current.indexOf(b.id)
    );
}

export const Tactical = (props: Props) => {
    const objects = useRoomState(props.room, state => state.objects) as Record<string, GameObjectInfo>;
    const localShip = objects[props.shipId] as ShipInfo;
    const targets = useStableOrderedTargets(objects, localShip);

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

    if (!localShip?.tacticalState) {
        return <div>unable to load</div>;
    }

    const tacticalState = localShip.tacticalState as unknown as TacticalSystemClientInfo;

    return (
        <TacticalDisplay
            cards={tacticalState.hand}
            slots={tacticalState.slots}
            timeProvider={props.timeProvider}
            shipMotion={localShip.motion}
            targets={targets}
            vulnerabilitiesByTarget={tacticalState.vulnerabilitiesByTarget}
            onPause={pause}
            power={tacticalState.powerLevel}
            maxHandSize={tacticalState.maxHandSize}
            drawPileSize={tacticalState.drawPileSize}
            playCard={playCard}
            cardGeneration={tacticalState.cardGeneration}
        />
    );
};

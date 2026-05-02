import { useRoomState } from '@colyseus/react';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { GameObjectInfo, ShipInfo } from 'common-data/features/space/types/GameObjectInfo';
import { useCallback, useState } from 'react';
import { TacticalDisplay } from './components/TacticalDisplay';
import { ListTargetInfo } from './components/TargetList';
import { SlotProps } from './components/WeaponSlot';
import type { Room } from '@colyseus/sdk';
import type { GameState } from 'engine/state/GameState';

type Props = {
    room: Room<{ state: GameState }>;
    shipId: string;
};

export const Tactical = (props: Props) => {
    const objects = useRoomState(props.room, state => state.objects) as Record<string, GameObjectInfo>;
    const localShip = objects[props.shipId] as ShipInfo;
    const [slots] = useState<SlotProps[]>([]);
    const [targets] = useState<ListTargetInfo[]>([]);

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

    const tacticalState = localShip.tacticalState;

    return (
        <TacticalDisplay
            cards={tacticalState.hand}
            slots={slots}
            targets={targets}
            onPause={pause}
            power={tacticalState.powerLevel}
            maxHandSize={tacticalState.maxHandSize}
            drawPileSize={tacticalState.drawPileSize}
            playCard={playCard}
            cardGeneration={tacticalState.cardGeneration}
        />
    );
};

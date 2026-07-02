import { Snapshot, useRoomState } from '@colyseus/react';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { GameObjectInfo, ShipInfo } from 'common-data/features/space/types/GameObjectInfo';
import { useCallback } from 'react';
import { useStableOrderedTargets } from 'src/hooks/useStableOrderedTargets';
import { ScienceDisplay } from './components/ScienceDisplay';
import type { Room } from '@colyseus/sdk';
import type { GameState } from 'engine/state/GameState';

type Props = {
    room: Room<{ state: GameState }>;
    shipId: string;
};

export const Science = (props: Props) => {
    const objects = useRoomState(props.room, state => state.objects) as Record<string, Snapshot<GameObjectInfo>>;
    const localShip = objects?.[props.shipId] as unknown as Snapshot<ShipInfo>;
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

    if (!localShip?.scienceState?.hand) {
        return <div>unable to load</div>;
    }

    const scienceState = localShip.scienceState;

    return (
        <ScienceDisplay
            cards={scienceState.hand}
            targets={targets}
            scannedShipId={scienceState.scannedShipId}
            systemOrderByTarget={scienceState.systemOrderByTarget}
            scannedHelm={scienceState.scannedHelm}
            scannedTactical={scienceState.scannedTactical}
            scannedScience={scienceState.scannedScience}
            scannedEngineer={scienceState.scannedEngineer}
            modifierSlot={scienceState.modifierSlotCard?.type ?? null}
            substanceSlot={scienceState.substanceSlotCard?.type ?? null}
            deliverySlot={scienceState.deliverySlotCard?.type ?? null}
            deflectorCard={scienceState.deflectorCard}
            onPause={pause}
            power={scienceState.powerLevel}
            maxHandSize={scienceState.maxHandSize}
            drawPileSize={scienceState.drawPileSize}
            playCard={playCard}
            cardGeneration={scienceState.cardGeneration}
        />
    );
};

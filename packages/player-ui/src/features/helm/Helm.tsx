import { Snapshot, useRoomState } from '@colyseus/react';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { GameObjectInfo, ShipInfo } from 'common-data/features/space/types/GameObjectInfo';
import { useWeaponEffects } from 'common-ui/hooks/useWeaponEffects';
import { useCallback } from 'react';
import { HelmDisplay } from './components/HelmDisplay';
import type { Room } from '@colyseus/sdk';
import type { GameState } from 'engine/state/GameState';

type Props = {
    room: Room<{ state: GameState }>;
    shipId: string;
};

export const Helm = (props: Props) => {
    const objects = useRoomState(props.room, state => state.objects) as Record<string, Snapshot<GameObjectInfo>>;
    const localShip = objects?.[props.shipId] as unknown as Snapshot<ShipInfo>;
    const weaponEffectsRef = useWeaponEffects(props.room);

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

    const cancelManeuver = useCallback(() => {
        props.room.send('cancelManeuver');
    }, [props.room]);

    if (!localShip?.helmState?.hand) {
        return <div>unable to load</div>;
    }

    const helmState = localShip.helmState;

    return (
        <HelmDisplay
            cards={helmState.hand}
            onPause={pause}
            center={localShip.motion}
            objects={objects}
            power={helmState.powerLevel}
            maxHandSize={helmState.maxHandSize}
            drawPileSize={helmState.drawPileSize}
            playCard={playCard}
            cardGeneration={helmState.cardGeneration}
            cancelManeuver={cancelManeuver}
            activeManeuver={helmState.activeManeuver}
            weaponEffectsRef={weaponEffectsRef}
        />
    );
};

import { Snapshot, useRoomState } from '@colyseus/react';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { GameObjectInfo, PlayerShipInfo } from 'common-data/features/space/types/GameObjectInfo';
import { useCallback } from 'react';
import { useDeckView } from '../deck/hooks/useDeckView';
import { NonEncounterDisplay } from '../nonEncounter/components/NonEncounterDisplay';
import { isOutsideEncounter } from '../nonEncounter/isOutsideEncounter';
import { useOrders } from '../orders/hooks/useOrders';
import { useShop } from '../shop/hooks/useShop';
import { EngineerDisplay } from './components/EngineerDisplay';
import type { Room } from '@colyseus/sdk';
import type { GamePhase } from 'common-data/features/sectors/types/GamePhase';
import type { SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { GameState } from 'engine/state/GameState';

type Props = {
    room: Room<unknown, GameState>;
    shipId: string;
};

export const Engineer = (props: Props) => {
    const objects = useRoomState(props.room, state => state.objects) as Record<string, Snapshot<GameObjectInfo>>;
    const localShip = objects?.[props.shipId] as unknown as Snapshot<PlayerShipInfo>;

    const phase = (useRoomState(props.room, state => state.phase) ?? null) as GamePhase | null;
    const encounterKind = (useRoomState(props.room, state => state.encounterKind) ?? null) as SectorNodeKind | null;
    const deckView = useDeckView(props.room, localShip?.engineerState);
    const shop = useShop(props.room, 'engineer', localShip?.engineerState, localShip?.antimatter ?? 0);
    const orders = useOrders(props.room, 'engineer', localShip?.engineerState, localShip);

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

    const repair = useCallback((system: string) => {
        props.room.send('repair', { system });
    }, [props.room]);

    const resolveDrawChoice = useCallback((cardId: number) => {
        props.room.send('resolveDrawChoice', { cardId });
    }, [props.room]);

    if (!localShip?.engineerState?.hand) {
        return <div>unable to load</div>;
    }

    const engineerState = localShip.engineerState;

    if (isOutsideEncounter(phase, encounterKind)) {
        return (
            <NonEncounterDisplay
                crew="engineer"
                shop={shop}
                orders={orders}
                onPause={pause}
                power={phase === 'encounter' ? undefined : engineerState.powerLevel}
                deckSize={engineerState.deck.length}
                deckView={deckView}
                cardGeneration={engineerState.cardGeneration}
            />
        );
    }
    const systems = engineerState.systems;

    return (
        <EngineerDisplay
            cards={engineerState.hand}
            systems={systems}
            repairCapacity={engineerState.repairCapacity}
            maxRepairCapacity={engineerState.maxRepairCapacity}
            repair={repair}
            onPause={pause}
            power={engineerState.powerLevel}
            deckSize={engineerState.deck.length}
            deckView={deckView}
            playCard={playCard}
            cardGeneration={engineerState.cardGeneration}
            pendingDrawChoice={engineerState.pendingDrawChoice}
            resolveDrawChoice={resolveDrawChoice}
        />
    );
};

import { Snapshot, useRoomState } from '@colyseus/react';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { FactionRelationshipMap, GameObjectInfo, RelationshipViewer, ShipInfo, TacticalSystemInfo } from 'common-data/features/space/types/GameObjectInfo';
import { useCallback } from 'react';
import { useStableOrderedTargets } from 'src/hooks/useStableOrderedTargets';
import { TacticalDisplay } from './components/TacticalDisplay';
import type { Room } from '@colyseus/sdk';
import type { GameState } from 'engine/state/GameState';

type Props = {
    room: Room<{ state: GameState }>;
    shipId: string;
};

export const Tactical = (props: Props) => {
    const objects = useRoomState(props.room, state => state.objects) as Record<string, Snapshot<GameObjectInfo>>;
    const factions = useRoomState(props.room, state => state.factions) as Record<string, { relations: FactionRelationshipMap }>;
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

    if (!localShip?.tacticalState?.hand) {
        return <div>unable to load</div>;
    }

    const tacticalState = localShip.tacticalState as unknown as Snapshot<TacticalSystemInfo>;

    const viewerFaction = localShip?.faction ?? null;
    const viewer: RelationshipViewer = {
        shipId: props.shipId,
        faction: viewerFaction,
        relations: viewerFaction ? factions?.[viewerFaction]?.relations ?? null : null,
    };

    return (
        <TacticalDisplay
            cards={tacticalState.hand}
            slots={tacticalState.slots}
            shipMotion={localShip.motion}
            targets={targets}
            subTargetsByTarget={tacticalState.subTargetsByTarget}
            onPause={pause}
            power={tacticalState.powerLevel}
            maxHandSize={tacticalState.maxHandSize}
            drawPileSize={tacticalState.drawPileSize}
            playCard={playCard}
            cardGeneration={tacticalState.cardGeneration}
            viewer={viewer}
        />
    );
};

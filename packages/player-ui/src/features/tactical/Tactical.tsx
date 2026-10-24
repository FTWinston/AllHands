import { Snapshot, useRoomState } from '@colyseus/react';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { FactionRelationshipMap, GameObjectInfo, RelationshipViewer, PlayerShipInfo, TacticalSystemInfo } from 'common-data/features/space/types/GameObjectInfo';
import { useCallback } from 'react';
import { useStableOrderedTargets } from 'src/hooks/useStableOrderedTargets';
import { useDeckView } from '../deck/hooks/useDeckView';
import { NonEncounterDisplay } from '../nonEncounter/components/NonEncounterDisplay';
import { isOutsideEncounter } from '../nonEncounter/isOutsideEncounter';
import { SectorMessagePrompt } from './components/SectorMessagePrompt';
import { TacticalDisplay } from './components/TacticalDisplay';
import type { Room } from '@colyseus/sdk';
import type { GamePhase } from 'common-data/features/sectors/types/GamePhase';
import type { SectorMessageInfo } from 'common-data/features/sectors/types/SectorMessageInfo';
import type { GameState } from 'engine/state/GameState';

type Props = {
    room: Room<unknown, GameState>;
    shipId: string;
};

export const Tactical = (props: Props) => {
    const objects = useRoomState(props.room, state => state.objects) as Record<string, Snapshot<GameObjectInfo>>;
    const factions = useRoomState(props.room, state => state.factions) as Record<string, { relations: FactionRelationshipMap }>;
    const localShip = objects?.[props.shipId] as unknown as Snapshot<PlayerShipInfo>;
    const targets = useStableOrderedTargets(objects, localShip);
    const phase = (useRoomState(props.room, state => state.phase) ?? null) as GamePhase | null;
    const deckView = useDeckView(props.room, 'tactical', localShip);
    const message = (useRoomState(props.room, state => state.message) ?? null) as unknown as SectorMessageInfo | null;

    const dismissMessage = useCallback(() => {
        props.room.send('dismissMessage');
    }, [props.room]);
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

    const resolveDrawChoice = useCallback((cardId: number) => {
        props.room.send('resolveDrawChoice', { cardId });
    }, [props.room]);

    if (!localShip?.tacticalState?.hand) {
        return <div>unable to load</div>;
    }

    const tacticalState = localShip.tacticalState as unknown as Snapshot<TacticalSystemInfo>;

    if (isOutsideEncounter(phase)) {
        return (
            <NonEncounterDisplay
                crew="tactical"
                onPause={pause}
                power={tacticalState.powerLevel}
                deckSize={tacticalState.deck.length}
                deckView={deckView}
                cardGeneration={tacticalState.cardGeneration}
            >
                {(phase === 'sectorIntro' || phase === 'sectorOutro') && (
                    <SectorMessagePrompt message={message} onDismiss={dismissMessage} />
                )}
            </NonEncounterDisplay>
        );
    }

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
            deckSize={tacticalState.deck.length}
            deckView={deckView}
            playCard={playCard}
            cardGeneration={tacticalState.cardGeneration}
            viewer={viewer}
            pendingDrawChoice={tacticalState.pendingDrawChoice}
            resolveDrawChoice={resolveDrawChoice}
        />
    );
};

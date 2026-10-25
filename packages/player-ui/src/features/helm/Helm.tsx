import { Snapshot, useRoomState } from '@colyseus/react';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { FactionRelationshipMap, GameObjectInfo, RelationshipViewer, PlayerShipInfo } from 'common-data/features/space/types/GameObjectInfo';
import { useWeaponEffects } from 'common-ui/hooks/useWeaponEffects';
import { useCallback } from 'react';
import { useDeckView } from '../deck/hooks/useDeckView';
import { NonEncounterDisplay } from '../nonEncounter/components/NonEncounterDisplay';
import { isOutsideEncounter } from '../nonEncounter/isOutsideEncounter';
import { useShop } from '../shop/hooks/useShop';
import { HelmDisplay } from './components/HelmDisplay';
import type { Room } from '@colyseus/sdk';
import type { GamePhase } from 'common-data/features/sectors/types/GamePhase';
import type { SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { GameState } from 'engine/state/GameState';

type Props = {
    room: Room<unknown, GameState>;
    shipId: string;
};

export const Helm = (props: Props) => {
    const objects = useRoomState(props.room, state => state.objects) as Record<string, Snapshot<GameObjectInfo>>;
    const factions = useRoomState(props.room, state => state.factions) as Record<string, { relations: FactionRelationshipMap }>;
    const localShip = objects?.[props.shipId] as unknown as Snapshot<PlayerShipInfo>;
    const weaponEffectsRef = useWeaponEffects(props.room);

    const phase = (useRoomState(props.room, state => state.phase) ?? null) as GamePhase | null;
    const encounterKind = (useRoomState(props.room, state => state.encounterKind) ?? null) as SectorNodeKind | null;
    const deckView = useDeckView(props.room, 'helm', localShip?.helmState, localShip?.antimatter ?? 0);
    const shop = useShop(props.room, 'helm', localShip?.helmState, localShip?.antimatter ?? 0);

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

    const playNonEncounterCard = useCallback((cardId: number) => {
        props.room.send('playNonEncounterCard', { cardId });
    }, [props.room]);

    const resolveDrawChoice = useCallback((cardId: number) => {
        props.room.send('resolveDrawChoice', { cardId });
    }, [props.room]);

    if (!localShip?.helmState?.hand) {
        return <div>unable to load</div>;
    }

    const helmState = localShip.helmState;

    // Outside an encounter, these cards are offered instead of the usual display. At a station, helm's hand only ever holds the Warp Away card.
    if (isOutsideEncounter(phase, encounterKind) || helmState.nonEncounterCards.length > 0) {
        return (
            <NonEncounterDisplay
                crew="helm"
                cards={helmState.nonEncounterCards}
                playCard={playNonEncounterCard}
                hand={helmState.hand}
                playHandCard={playCard}
                shop={shop}
                onPause={pause}
                deckSize={helmState.deck.length}
                deckView={deckView}
                cardGeneration={helmState.cardGeneration}
            />
        );
    }

    const viewerFaction = localShip.faction ?? null;
    const viewer: RelationshipViewer = {
        shipId: props.shipId,
        faction: viewerFaction,
        relations: viewerFaction ? factions?.[viewerFaction]?.relations ?? null : null,
    };

    return (
        <HelmDisplay
            cards={helmState.hand}
            onPause={pause}
            center={localShip.motion}
            objects={objects}
            viewer={viewer}
            power={helmState.powerLevel}
            deckSize={helmState.deck.length}
            deckView={deckView}
            playCard={playCard}
            cardGeneration={helmState.cardGeneration}
            cancelManeuver={cancelManeuver}
            activeManeuver={helmState.activeManeuver}
            weaponEffectsRef={weaponEffectsRef}
            pendingDrawChoice={helmState.pendingDrawChoice}
            resolveDrawChoice={resolveDrawChoice}
        />
    );
};

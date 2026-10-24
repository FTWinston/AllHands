import { Snapshot, useRoomState } from '@colyseus/react';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { FactionRelationshipMap, GameObjectInfo, RelationshipViewer, PlayerShipInfo, ShipInfo } from 'common-data/features/space/types/GameObjectInfo';
import { useCallback } from 'react';
import { useStableOrderedTargets } from 'src/hooks/useStableOrderedTargets';
import { useDeckView } from '../deck/useDeckView';
import { NonEncounterDisplay } from '../nonEncounter/components/NonEncounterDisplay';
import { isOutsideEncounter } from '../nonEncounter/isOutsideEncounter';
import { LongRangeSensorList } from './components/LongRangeSensorList';
import { ScienceDisplay } from './components/ScienceDisplay';
import type { Room } from '@colyseus/sdk';
import type { GamePhase } from 'common-data/features/sectors/types/GamePhase';
import type { GameState } from 'engine/state/GameState';

type Props = {
    room: Room<unknown, GameState>;
    shipId: string;
};

export const Science = (props: Props) => {
    const objects = useRoomState(props.room, state => state.objects) as Record<string, Snapshot<GameObjectInfo>>;
    const factions = useRoomState(props.room, state => state.factions) as Record<string, { relations: FactionRelationshipMap }>;
    const localShip = objects?.[props.shipId] as unknown as Snapshot<ShipInfo>;
    const targets = useStableOrderedTargets(objects, localShip);

    const phase = (useRoomState(props.room, state => state.phase) ?? null) as GamePhase | null;
    const deckView = useDeckView(props.room, 'science', localShip as Snapshot<PlayerShipInfo> | undefined);

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

    const closeRevealedSystem = useCallback(() => {
        props.room.send('closeScan');
    }, [props.room]);

    const unmountDeflectorModifier = useCallback(() => {
        props.room.send('unmountDeflector', { slot: 'modifier' });
    }, [props.room]);

    const unmountDeflectorSubstance = useCallback(() => {
        props.room.send('unmountDeflector', { slot: 'substance' });
    }, [props.room]);

    const unmountDeflectorDelivery = useCallback(() => {
        props.room.send('unmountDeflector', { slot: 'delivery' });
    }, [props.room]);

    const resolveDrawChoice = useCallback((cardId: number) => {
        props.room.send('resolveDrawChoice', { cardId });
    }, [props.room]);

    if (!localShip?.scienceState?.hand) {
        return <div>unable to load</div>;
    }

    const scienceState = localShip.scienceState;

    // Outside an encounter, long range sensors show what the next destinations hold, instead of the usual display.
    if (isOutsideEncounter(phase)) {
        return (
            <NonEncounterDisplay
                crew="science"
                onPause={pause}
                power={scienceState.powerLevel}
                deckSize={scienceState.deck.length}
                deckView={deckView}
                cardGeneration={scienceState.cardGeneration}
            >
                {phase === 'map' && <LongRangeSensorList destinations={scienceState.destinations} />}
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
        <ScienceDisplay
            cards={scienceState.hand}
            targets={targets}
            scannedShipId={scienceState.scannedShipId}
            systemOrderByTarget={scienceState.systemOrderByTarget}
            identifiedVulnerability={scienceState.identifiedVulnerability}
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
            deckSize={scienceState.deck.length}
            deckView={deckView}
            playCard={playCard}
            cardGeneration={scienceState.cardGeneration}
            viewer={viewer}
            closeRevealedSystem={closeRevealedSystem}
            unmountDeflectorDelivery={unmountDeflectorDelivery}
            unmountDeflectorModifier={unmountDeflectorModifier}
            unmountDeflectorSubstance={unmountDeflectorSubstance}
            pendingDrawChoice={scienceState.pendingDrawChoice}
            resolveDrawChoice={resolveDrawChoice}
        />
    );
};

import { useRoomState, type Snapshot } from '@colyseus/react';
import { bundleVotesNeeded } from 'common-data/features/cards/utils/cardRewardCounts';
import { crewRoleNames, type CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { useCallback } from 'react';
import { isOutsideEncounter } from '../../nonEncounter/isOutsideEncounter';
import type { BundleOption, RewardsModel } from '../types/RewardsModel';
import type { Room } from '@colyseus/sdk';
import type { OutfitBundleInfo } from 'common-data/features/cards/types/CardRewardInfo';
import type { GamePhase } from 'common-data/features/sectors/types/GamePhase';
import type { SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { CrewSystemInfo, PlayerShipInfo } from 'common-data/features/space/types/GameObjectInfo';
import type { GameState } from 'engine/state/GameState';

/**
 * Controls the cards a crew member is gaining outside of an encounter: replacing a card in a full deck, and choosing their outfitting card or bundle.
 * Returns null during an encounter.
 */
export function useRewards(room: Room<unknown, GameState>, crew: CrewRoleName, system: Snapshot<CrewSystemInfo> | undefined, ship: Snapshot<PlayerShipInfo> | undefined): RewardsModel | null {
    const phase = (useRoomState(room, state => state.phase) ?? null) as GamePhase | null;
    const encounterKind = (useRoomState(room, state => state.encounterKind) ?? null) as SectorNodeKind | null;

    const replaceDeckCard = useCallback((cardId: number) => {
        room.send('replaceDeckCard', { cardId });
    }, [room]);

    const discardIncomingCard = useCallback(() => {
        room.send('discardIncomingCard');
    }, [room]);

    const takeOutfitCard = useCallback((cardId: number) => {
        room.send('takeOutfitCard', { cardId });
    }, [room]);

    const voteBundle = useCallback((bundleIndex: number) => {
        room.send('voteBundle', { bundleIndex });
    }, [room]);

    if (!isOutsideEncounter(phase, encounterKind) || !system || !ship) {
        return null;
    }

    // Snapshots of map schemas are plain objects.
    const votes = (ship.bundleVotes ?? {}) as Readonly<Partial<Record<CrewRoleName, number>>>;
    const bundles = (ship.outfitBundles ?? []) as Snapshot<OutfitBundleInfo[]>;

    return {
        crew,
        incomingCard: system.incomingCards?.[0] ?? null,
        incomingCount: system.incomingCards?.length ?? 0,
        deckCards: system.deck,
        maxDeckSize: system.maxDeckSize,
        outfitCards: system.outfitCards ?? [],
        bundles: bundles.flatMap((bundle, index): BundleOption[] => {
            const offer = bundle.cards.find(candidate => candidate.role === crew);
            return offer
                ? [{ index, card: offer.card, standout: bundle.standout === crew, voters: crewRoleNames.filter(role => votes[role] === index) }]
                : [];
        }),
        vote: votes[crew] ?? null,
        votesNeeded: bundleVotesNeeded,
        replaceDeckCard,
        discardIncomingCard,
        takeOutfitCard,
        voteBundle,
    };
}

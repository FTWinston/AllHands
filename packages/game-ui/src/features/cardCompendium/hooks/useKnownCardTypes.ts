import { useSyncExternalStore } from 'react';
import { getKnownCardTypes, subscribeToKnownCardTypes } from '../utils/knownCardStorage';
import type { CardType } from 'common-data/features/cards/utils/cardDefinitions';

/** The card types known on this device, updating as more become known. */
export function useKnownCardTypes(): ReadonlySet<CardType> {
    return useSyncExternalStore(subscribeToKnownCardTypes, getKnownCardTypes);
}

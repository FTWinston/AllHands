import { isKnowableCardType } from 'common-data/features/cards/utils/getKnowableCardTypes';
import type { CardType } from 'common-data/features/cards/utils/cardDefinitions';

const storageKey = 'allhands.knownCardTypes';

/** Parse stored known card types, dropping anything that's no longer a knowable card type (e.g. a card that's since been removed). */
export function parseKnownCardTypes(stored: string | null): Set<CardType> {
    if (!stored) {
        return new Set();
    }

    try {
        const parsed: unknown = JSON.parse(stored);
        return Array.isArray(parsed)
            ? new Set(parsed.filter((type): type is CardType => typeof type === 'string' && isKnowableCardType(type)))
            : new Set();
    } catch {
        return new Set();
    }
}

function load(): Set<CardType> {
    try {
        return parseKnownCardTypes(localStorage.getItem(storageKey));
    } catch {
        // Storage can be unavailable, e.g. in private browsing. Nothing is known yet, then.
        return new Set();
    }
}

// Loaded on first use, rather than on import.
let known: ReadonlySet<CardType> | null = null;
const listeners = new Set<() => void>();

/** The card types this device has seen, across every game played on it. */
export function getKnownCardTypes(): ReadonlySet<CardType> {
    known ??= load();
    return known;
}

/**
 * Add card types to those known on this device, ignoring any that aren't knowable (e.g. expendable cards) or are already known.
 * The viewscreen calls this with the cards its crew has seen (`PlayerShipInfo.seenCardTypes`). Returns whether anything new became known.
 */
export function addKnownCardTypes(types: Iterable<string>): boolean {
    const current = getKnownCardTypes();
    const added = [...types].filter((type): type is CardType => isKnowableCardType(type) && !current.has(type));

    if (added.length === 0) {
        return false;
    }

    // A new set each time, so useSyncExternalStore sees the change.
    known = new Set([...current, ...added]);

    try {
        localStorage.setItem(storageKey, JSON.stringify([...known]));
    } catch {
        // Storage can be unavailable, e.g. in private browsing. These cards just won't be remembered after this session.
    }

    for (const listener of listeners) {
        listener();
    }

    return true;
}

/** Be told whenever more card types become known. Returns a function to stop listening. */
export function subscribeToKnownCardTypes(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

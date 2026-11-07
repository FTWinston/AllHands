import { ArraySchema, MapSchema } from '@colyseus/schema';
import { CardState } from 'src/state/CardState';

/**
 * Update `target` to hold copies of the cards in `source`, in the same order, with the same modifiers and extra traits.
 * Existing copies are kept and updated in place where possible, so that only actual changes are synced to clients.
 */
export function mirrorCards(source: ArraySchema<CardState>, target: ArraySchema<CardState>) {
    // Remove copies of cards that have left the source. Going backwards keeps the remaining indexes valid.
    const sourceIds = new Set(source.map(card => card.id));
    for (let i = target.length - 1; i >= 0; i--) {
        if (!sourceIds.has(target[i].id)) {
            target.splice(i, 1);
        }
    }

    for (let i = 0; i < source.length; i++) {
        const card = source[i];
        const copy = target[i];

        if (copy?.id === card.id) {
            mirrorMap(card.modifiers, copy.modifiers);
            mirrorMap(card.extraTraits, copy.extraTraits);
            continue;
        }

        // The card is new or has moved: insert a fresh copy here, and remove any copy from later on.
        const oldIndex = target.findIndex((other, index) => index > i && other.id === card.id);
        if (oldIndex !== -1) {
            target.splice(oldIndex, 1);
        }
        target.splice(i, 0, card.cloneCard());
    }
}

function mirrorMap<V, K extends string>(source: MapSchema<V, K>, target: MapSchema<V, K>) {
    for (const key of [...target.keys()]) {
        if (!source.has(key)) {
            target.delete(key);
        }
    }

    for (const [key, value] of source) {
        if (target.get(key) !== value) {
            target.set(key, value);
        }
    }
}

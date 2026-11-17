import { IArray } from '@colyseus/react';
import { useEffect, useRef, useState } from 'react';

/**
 * The items to show: every item in `items`, plus any known item that has since left it, so that it can animate out where it was.
 * A known item that's still present is replaced by its current version, as state snapshots are immutable: a change to an item, such as a card being damaged, comes as a new object.
 */
export function mergeKnownItems<TItem, TItemId>(knownItems: IArray<TItem>, items: IArray<TItem>, getId: (item: TItem) => TItemId): TItem[] {
    const currentItems = new Map(items.map(item => [getId(item), item]));
    const knownIds = new Set(knownItems.map(getId));

    return [
        ...knownItems.map(knownItem => currentItems.get(getId(knownItem)) ?? knownItem),
        ...items.filter(item => !knownIds.has(getId(item))),
    ];
}

export function useArrayChanges<TItem, TItemId>(items: IArray<TItem>, getId: (item: TItem) => TItemId) {
    const knownItems = useRef<IArray<TItem>>(items);
    const [currentItemIds, setCurrentItemIds] = useState<Set<TItemId>>(() => new Set(items.map(getId)));
    const [removingItemIds, setRemovingItemIds] = useState<Set<TItemId>>(() => new Set());
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const itemIds = items.map(getId);
        const idsToAdd = itemIds.filter(id => !currentItemIds.has(id));
        const idsToRemove = [...currentItemIds].filter(id => !itemIds.includes(id));
        if (idsToAdd.length > 0 || idsToRemove.length > 0) {
            const frame = requestAnimationFrame(() => {
                setCurrentItemIds(prev => new Set([...prev, ...idsToAdd]
                    .filter(id => itemIds.includes(id))
                ));
            });
            return () => cancelAnimationFrame(frame);
        }
    }, [items, getId, currentItemIds]);

    knownItems.current = mergeKnownItems(knownItems.current, items, getId);

    useEffect(() => {
        const newlyRemovingItems = knownItems.current.filter((knownItem) => {
            const knownItemId = getId(knownItem);
            return !items.some(item => getId(item) === knownItemId) && !removingItemIds.has(knownItemId);
        });

        if (newlyRemovingItems.length === 0) {
            return;
        }

        // Any items in knownItems that are not in items should be added to removingItemIds.
        setRemovingItemIds((prev) => {
            const newSet = new Set(prev);
            for (const item of newlyRemovingItems) {
                newSet.add(getId(item));
            }
            return newSet;
        });

        // Any items in removingItemIds should be removed from there (and from knownItems) after a 500ms delay.
        // (Not clearing this timeout if the effect runs again, so that further item removals won't delay in-progress removals.)
        setTimeout(() => {
            setRemovingItemIds((prev) => {
                const newSet = new Set(prev);
                for (const item of newlyRemovingItems) {
                    newSet.delete(getId(item));
                }
                return newSet;
            });

            knownItems.current = knownItems.current.filter((item) => {
                const itemId = getId(item);
                return !newlyRemovingItems.some(removing => getId(removing) === itemId);
            });
        }, 330);
    }, [items, getId, removingItemIds]);

    return { knownItems: knownItems.current, currentItemIds, removingItemIds };
}

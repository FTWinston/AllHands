import { MinimalArray } from 'common-data/types/MinimalArray';
import { useEffect, useRef, useState } from 'react';

export function useArrayChanges<TItem, TItemId>(items: MinimalArray<TItem>, getId: (item: TItem) => TItemId) {
    const knownItems = useRef<MinimalArray<TItem>>(items);
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

    // Add any items from items into knownItems, if not already in there.
    knownItems.current = [...knownItems.current, ...items.filter((item) => {
        const itemId = getId(item);
        return !knownItems.current.some(knownItem => getId(knownItem) === itemId);
    })];

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

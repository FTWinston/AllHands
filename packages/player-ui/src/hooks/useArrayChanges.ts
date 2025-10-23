import { useEffect, useRef, useState } from 'react';

export function useArrayChanges<TItem extends { id: TItemId }, TItemId>(items: TItem[]) {
    const knownItems = useRef<TItem[]>(items);
    const [currentItemIds, setCurrentItemIds] = useState<Set<TItemId>>(() => new Set(items.map(item => item.id)));
    const [removingItemIds, setRemovingItemIds] = useState<Set<TItemId>>(() => new Set());
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const itemIds = items.map(item => item.id);
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
    }, [items, currentItemIds]);

    // Add any items from items into knownItems, if not already in there.
    knownItems.current = [...knownItems.current, ...items.filter(item => !knownItems.current.some(knownItem => knownItem.id === item.id))];

    useEffect(() => {
        const newlyRemovingItems = knownItems.current.filter(knownItem => !items.some(item => item.id === knownItem.id) && !removingItemIds.has(knownItem.id));

        if (newlyRemovingItems.length === 0) {
            return;
        }

        // Any items in knownItems that are not in items should be added to removingItemIds.
        setRemovingItemIds((prev) => {
            const newSet = new Set(prev);
            for (const item of newlyRemovingItems) {
                newSet.add(item.id);
            }
            return newSet;
        });

        // Any items in removingItemIds should be removed from there (and from knownItems) after a 500ms delay.
        // (Not clearing this timeout if the effect runs again, so that further item removals won't delay in-progress removals.)
        setTimeout(() => {
            setRemovingItemIds((prev) => {
                const newSet = new Set(prev);
                for (const item of newlyRemovingItems) {
                    newSet.delete(item.id);
                }
                return newSet;
            });

            knownItems.current = knownItems.current.filter(item => !newlyRemovingItems.some(removing => removing.id === item.id));
        }, 330);
    }, [items, removingItemIds]);

    return { knownItems: knownItems.current, currentItemIds, removingItemIds };
}

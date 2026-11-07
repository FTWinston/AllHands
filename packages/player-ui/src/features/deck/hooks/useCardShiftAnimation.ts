import { RefObject, useLayoutEffect, useRef } from 'react';

const duration = 200;

type Position = { x: number; y: number };

/** The name of the data attribute to put on each card's element, holding its id, for it to be animated by `useCardShiftAnimation`. */
export const cardIdAttribute = 'data-shift-card-id';

/**
 * When cards in a grid change position, quickly slide them from their old position to their new one.
 * A card changing rows slides off the side it's moving towards and back on from the other, rather than cutting across the rows between.
 * So when every card moves up one place, each row looks like it's shuffling left, with cards wrapping around onto the end of the row above.
 *
 * @param listRef The grid. Each of its items must directly contain the element with `cardIdAttribute`, as positions are measured from the items, which aren't affected by a card's zoom.
 * @param cardIds The ids of the cards, in their displayed order, to run this when that changes.
 * @param enabled When false, nothing animates.
 */
export function useCardShiftAnimation(listRef: RefObject<HTMLElement | null>, cardIds: readonly number[], enabled: boolean) {
    const previousPositions = useRef<Map<string, Position> | null>(null);
    const order = cardIds.join();

    useLayoutEffect(() => {
        const list = listRef.current;
        if (!list || !enabled) {
            previousPositions.current = null;
            return;
        }

        const previous = previousPositions.current;
        const current = new Map<string, Position>();
        const shouldAnimate = previous !== null && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        for (const card of list.querySelectorAll<HTMLElement>(`[${cardIdAttribute}]`)) {
            const item = card.parentElement!;
            // Relative to the grid, which itself moves when e.g. a hand above it gets another row.
            const position = { x: item.offsetLeft - list.offsetLeft, y: item.offsetTop - list.offsetTop };
            const id = card.getAttribute(cardIdAttribute)!;
            current.set(id, position);

            const from = previous?.get(id);
            if (shouldAnimate) {
                if (from) {
                    animateMove(card, from, position, item.offsetWidth);
                } else {
                    card.animate([{ opacity: 0 }, { opacity: 1 }], { duration });
                }
            }
        }

        previousPositions.current = current;
    }, [listRef, order, enabled]);
}

function animateMove(card: HTMLElement, from: Position, to: Position, width: number) {
    const x = from.x - to.x;
    const y = from.y - to.y;

    if (x === 0 && y === 0) {
        return;
    }

    if (y === 0) {
        card.animate(
            [{ transform: `translate(${x}px, 0)` }, { transform: 'none' }],
            { duration, easing: 'ease-out' }
        );
        return;
    }

    // Moving up the grid (towards the start) goes off to the left, moving down goes off to the right.
    const direction = y > 0 ? -1 : 1;
    card.animate(
        [
            { transform: `translate(${x}px, ${y}px)`, opacity: 1, easing: 'ease-in' },
            { transform: `translate(${x + direction * width}px, ${y}px)`, opacity: 0, offset: 0.5 },
            { transform: `translate(${-direction * width}px, 0)`, opacity: 0, offset: 0.5, easing: 'ease-out' },
            { transform: 'none', opacity: 1 },
        ],
        { duration }
    );
}

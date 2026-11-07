import { RefObject, useLayoutEffect, useRef } from 'react';

const duration = 450;

type Position = { x: number; y: number };

type Item = Position & {
    element: HTMLElement;
    width: number;
    height: number;
};

type Layout = {
    items: Map<string, Item>;
    height: number;
};

/** The name of the data attribute to put on each card's element, holding its id, for it to be animated by `useCardShiftAnimation`. */
export const cardIdAttribute = 'data-shift-card-id';

/**
 * When cards in a grid change position, slide them from their old position to their new one.
 * A card changing rows slides off the side it's moving towards and back on from the other, rather than cutting across the rows between.
 * So when every card moves up one place, each row looks like it's shuffling left, with cards wrapping around onto the end of the row above.
 * A card that leaves the grid, e.g. by being drawn from the top of the deck, slides off to the left.
 * When the grid gains or loses a row, its height animates too, so anything below it glides rather than jumps.
 *
 * @param listRef The grid. Each of its items must directly contain the element with `cardIdAttribute`, as positions are measured from the items, which aren't affected by a card's zoom.
 * @param cardIds The ids of the cards, in their displayed order, to run this when that changes.
 * @param enabled When false, nothing animates.
 */
export function useCardShiftAnimation(listRef: RefObject<HTMLElement | null>, cardIds: readonly number[], enabled: boolean) {
    const previousLayout = useRef<Layout | null>(null);
    const heightAnimation = useRef<Animation | null>(null);
    const order = cardIds.join();

    useLayoutEffect(() => {
        const list = listRef.current;
        if (!list || !enabled) {
            previousLayout.current = null;
            return;
        }

        const previous = previousLayout.current;
        const shouldAnimate = previous !== null && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // If the height was still changing, carry on from where it had got to, rather than jumping to where it was heading.
        const fromHeight = heightAnimation.current?.playState === 'running' ? list.offsetHeight : previous?.height;
        if (heightAnimation.current) {
            heightAnimation.current.cancel();
            heightAnimation.current = null;
            list.style.removeProperty('overflow-y');
        }

        // Positions are relative to the grid, which itself moves when e.g. a hand above it gets another row.
        const origin = getOrigin(list);
        const items = new Map<string, Item>();

        for (const card of list.querySelectorAll<HTMLElement>(`[${cardIdAttribute}]`)) {
            const element = card.parentElement!;
            const item = {
                element,
                x: element.offsetLeft - origin.x,
                y: element.offsetTop - origin.y,
                width: element.offsetWidth,
                height: element.offsetHeight,
            };
            const id = card.getAttribute(cardIdAttribute)!;
            items.set(id, item);

            const from = previous?.items.get(id);
            if (shouldAnimate) {
                if (from) {
                    animateMove(card, from, item, item.width);
                } else {
                    card.animate([{ opacity: 0 }, { opacity: 1 }], { duration });
                }
            }
        }

        if (shouldAnimate && previous) {
            for (const [id, item] of previous.items) {
                if (!items.has(id)) {
                    animateRemoval(list, item, origin);
                }
            }
        }

        const height = list.offsetHeight;
        if (shouldAnimate && fromHeight !== undefined && fromHeight !== height) {
            heightAnimation.current = animateHeight(list, fromHeight, height);
        }

        previousLayout.current = { items, height };
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
            { duration, easing: 'ease-in-out' }
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

/** Where the grid's top left is, in the coordinates its items' offsets are measured in. */
function getOrigin(list: HTMLElement): Position {
    return getComputedStyle(list).position === 'static'
        ? { x: list.offsetLeft, y: list.offsetTop }
        : { x: 0, y: 0 };
}

/**
 * React has already taken the card's item out of the grid, but it's left intact, so it's put back for as long as it takes to slide away.
 * Positioned over the grid, rather than in it, so the other cards can take its place.
 */
function animateRemoval(list: HTMLElement, item: Item, origin: Position) {
    const ghost = item.element;
    if (ghost.isConnected) {
        return;
    }

    // So it isn't measured as one of the grid's cards, if it changes again before this finishes.
    const card = ghost.querySelector(`[${cardIdAttribute}]`);
    card?.removeAttribute(cardIdAttribute);

    // Only the card leaves. Anything else, such as its position, stays put for whichever card takes its place.
    for (const child of ghost.children) {
        if (child !== card) {
            (child as HTMLElement).style.visibility = 'hidden';
        }
    }

    ghost.setAttribute('aria-hidden', 'true');
    Object.assign(ghost.style, {
        position: 'absolute',
        left: `${origin.x + item.x}px`,
        top: `${origin.y + item.y}px`,
        width: `${item.width}px`,
        height: `${item.height}px`,
        boxSizing: 'border-box',
        margin: '0',
        pointerEvents: 'none',
    });
    list.appendChild(ghost);

    const animation = ghost.animate(
        [{ transform: 'none', opacity: 1 }, { transform: `translateX(${-item.width}px)`, opacity: 0 }],
        { duration: duration / 2, easing: 'ease-in', fill: 'forwards' }
    );

    animation.addEventListener('finish', () => ghost.remove());
}

/** A row being added is revealed as the grid grows, rather than spilling over whatever's below it. */
function animateHeight(list: HTMLElement, from: number, to: number) {
    list.style.overflowY = 'clip';

    const animation = list.animate(
        [{ height: `${from}px` }, { height: `${to}px` }],
        { duration, easing: 'ease-in-out' }
    );

    // Whatever cancels it undoes this itself, as cancel events arrive too late, perhaps after another animation has started.
    animation.addEventListener('finish', () => list.style.removeProperty('overflow-y'));

    return animation;
}

import { useDraggable } from '@dnd-kit/core';
import { Card, CardProps } from 'common-ui/Card';
import { classNames } from 'common-ui/classNames';
import { FC, useEffect, useRef, useState } from 'react';
import styles from './CardHand.module.css';
import { useActiveCard } from './DragCardProvider';

type WrapperProps = {
    card: CardProps;
    state: 'in-hand' | 'adding' | 'removing';
    index: number;
};

const CardWrapper: FC<WrapperProps> = ({ card, state, index }) => {
    const activeCard = useActiveCard();

    const { attributes, listeners, setNodeRef } = useDraggable({
        id: card.id,
        data: card,
    });

    return (
        <li
            ref={setNodeRef}
            className={classNames(styles.cardWrapper, styles[state], activeCard?.id === card.id ? styles.dragging : null)}
            style={{
                // @ts-expect-error CSS custom property
                '--index': index,
            }}
            {...listeners}
            {...attributes}
        >
            <Card {...card} />
        </li>
    );
};

type Props = {
    cards: CardProps[];
};

function useTrackCardChanges(cards: CardProps[]) {
    const knownCards = useRef<CardProps[]>(cards);
    const [inHandCardIds, setInHandCardIds] = useState<Set<number>>(() => new Set(cards.map(card => card.id)));
    const [removingCardIds, setRemovingCardIds] = useState<Set<number>>(() => new Set());
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const cardIds = cards.map(card => card.id);
        const idsToAdd = cardIds.filter(id => !inHandCardIds.has(id));
        const idsToRemove = [...inHandCardIds].filter(id => !cardIds.includes(id));
        if (idsToAdd.length > 0 || idsToRemove.length > 0) {
            const frame = requestAnimationFrame(() => {
                setInHandCardIds(prev => new Set([...prev, ...idsToAdd]
                    .filter(id => cardIds.includes(id))
                ));
            });
            return () => cancelAnimationFrame(frame);
        }
    }, [cards, inHandCardIds]);

    // Add any items from cards into knownCards, if not already in there.
    knownCards.current = [...knownCards.current, ...cards.filter(card => !knownCards.current.some(knownCard => knownCard.id === card.id))];

    useEffect(() => {
        const newlyRemovingCards = knownCards.current.filter(knownCard => !cards.some(card => card.id === knownCard.id) && !removingCardIds.has(knownCard.id));

        if (newlyRemovingCards.length === 0) {
            return;
        }

        // Any cards in knownCards that are not in cards should be added to removingCardIds.
        setRemovingCardIds((prev) => {
            const newSet = new Set(prev);
            for (const card of newlyRemovingCards) {
                newSet.add(card.id);
            }
            return newSet;
        });

        // Any items in removingCardIds should be removed from there (and from knownCards) after a 500ms delay.
        // (Not clearing this timeout if the effect runs again, so that further card removals won't delay in-progress removals.)
        setTimeout(() => {
            setRemovingCardIds((prev) => {
                const newSet = new Set(prev);
                for (const card of newlyRemovingCards) {
                    newSet.delete(card.id);
                }
                return newSet;
            });

            knownCards.current = knownCards.current.filter(card => !newlyRemovingCards.some(removing => removing.id === card.id));
        }, 330);
    }, [cards, removingCardIds]);

    return { knownCards: knownCards.current, inHandCardIds, removingCardIds };
}

export const CardHand: FC<Props> = ({ cards }) => {
    const { knownCards, inHandCardIds, removingCardIds } = useTrackCardChanges(cards);

    return (
        <ul
            className={styles.hand}
            style={{
                // @ts-expect-error CSS custom property
                '--numCards': knownCards.length,
            }}
        >
            {knownCards.map((card, index) => (
                <CardWrapper
                    key={card.id}
                    card={card}
                    index={index}
                    state={removingCardIds.has(card.id) ? 'removing' : inHandCardIds.has(card.id) ? 'in-hand' : 'adding'}
                />
            ))}
        </ul>
    );
};

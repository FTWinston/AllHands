import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardProps } from 'common-ui/Card';
import { classNames } from 'common-ui/classNames';
import { FC } from 'react';
import { useArrayChanges } from 'src/hooks/useArrayChanges';
import styles from './CardHand.module.css';
import { useActiveCard, useIsOverValidTarget } from './DragCardProvider';

type WrapperProps = {
    card: CardProps;
    state: 'in-hand' | 'adding' | 'removing';
    index: number;
    numCards: number;
};

const CardWrapper: FC<WrapperProps> = ({ card, state, index, numCards }) => {
    const activeCard = useActiveCard();
    const isOverValidTarget = useIsOverValidTarget();

    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: card.id,
        data: { ...card, index, numCards },
    });

    const isBeingDragged = activeCard?.id === card.id;
    const canDrop = isBeingDragged && isOverValidTarget;

    return (
        <li
            ref={setNodeRef}
            className={classNames(
                styles.cardWrapper,
                styles[state],
                isBeingDragged ? styles.dragging : null,
                canDrop ? styles.canDrop : null
            )}
            style={{
                // @ts-expect-error CSS custom property
                '--index': index,
                'transform': CSS.Translate.toString(transform),
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

export const CardHand: FC<Props> = ({ cards }) => {
    const { knownItems: knownCards, currentItemIds: inHandCardIds, removingItemIds: removingCardIds } = useArrayChanges(cards);

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
                    numCards={knownCards.length}
                    state={removingCardIds.has(card.id) ? 'removing' : inHandCardIds.has(card.id) ? 'in-hand' : 'adding'}
                />
            ))}
        </ul>
    );
};

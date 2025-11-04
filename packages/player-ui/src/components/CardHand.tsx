import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { CardInstance, CardType } from 'common-types';
import { CardDisplay } from 'common-ui/CardDisplay';
import { classNames } from 'common-ui/classNames';
import { getCardDefinition } from 'common-ui/uiCardDefinitions';
import { FC } from 'react';
import { useArrayChanges } from 'src/hooks/useArrayChanges';
import styles from './CardHand.module.css';
import { useActiveCard, useIsOverValidTarget } from './DragCardProvider';

type WrapperProps = {
    id: number;
    type: CardType;
    state: 'in-hand' | 'adding' | 'removing';
    index: number;
};

const CardWrapper: FC<WrapperProps> = ({ id, type, state, index }) => {
    const activeCard = useActiveCard();
    const isOverValidTarget = useIsOverValidTarget();

    const definition = getCardDefinition(type);

    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id,
        data: { id, targetType: definition.targetType },
    });

    const isBeingDragged = activeCard?.id === id;
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
            <CardDisplay {...definition} />
        </li>
    );
};

type Props = {
    cards: CardInstance[];
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
                    id={card.id}
                    type={card.type}
                    index={index}
                    state={removingCardIds.has(card.id) ? 'removing' : inHandCardIds.has(card.id) ? 'in-hand' : 'adding'}
                />
            ))}
        </ul>
    );
};

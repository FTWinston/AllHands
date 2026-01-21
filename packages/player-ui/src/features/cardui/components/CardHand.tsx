import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { MinimalReadonlyArray } from 'common-data/types/MinimalArray';
import { classNames } from 'common-ui/utils/classNames';
import { FC } from 'react';
import { useArrayChanges } from 'src/hooks/useArrayChanges';
import styles from './CardHand.module.css';
import { DraggableCard } from './DraggableCard';

type Props = {
    cards: MinimalReadonlyArray<CardInstance>;
    power: number;
    shiftDown?: boolean;
};

const getCardId = (card: CardInstance) => card.id;

export const CardHand: FC<Props> = ({ cards, power, shiftDown }) => {
    const { knownItems: knownCards, currentItemIds: inHandCardIds, removingItemIds: removingCardIds } = useArrayChanges(cards, getCardId);

    return (
        <div
            className={classNames(styles.hand, shiftDown ? styles.handShiftedDown : null)}
            style={{
                // @ts-expect-error CSS custom property
                '--numCards': knownCards.length,
            }}
        >
            {knownCards.map((card, index) => (
                <DraggableCard
                    key={card.id}
                    id={card.id}
                    type={card.type}
                    power={power}
                    index={index}
                    className={classNames(
                        styles.card,
                        removingCardIds.has(card.id) ? styles.removing : inHandCardIds.has(card.id) ? null : styles.adding
                    )}
                />
            ))}
        </div>
    );
};

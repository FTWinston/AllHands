import { CardInstance } from 'common-data/types/CardInstance';
import { classNames } from 'common-ui/utils/classNames';
import { FC } from 'react';
import { useArrayChanges } from 'src/hooks/useArrayChanges';
import styles from './CardHand.module.css';
import { DraggableCard } from './DraggableCard';

type Props = {
    cards: CardInstance[];
};

const getCardId = (card: CardInstance) => card.id;

export const CardHand: FC<Props> = ({ cards }) => {
    const { knownItems: knownCards, currentItemIds: inHandCardIds, removingItemIds: removingCardIds } = useArrayChanges(cards, getCardId);

    return (
        <div
            className={styles.hand}
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

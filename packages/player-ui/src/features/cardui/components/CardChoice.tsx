import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { Button } from 'common-ui/components/Button';
import { classNames } from 'common-ui/utils/classNames';
import { FC } from 'react';
import styles from './CardChoice.module.css';
import { useActiveCard } from './DragCardProvider';
import { DraggableCard } from './DraggableCard';

type Props = {
    cardId: number;
    cardTypes: CardType[];
    onCancel: () => void;
};

export const CardChoice: FC<Props> = ({ cardId, cardTypes, onCancel }) => {
    const activeCard = useActiveCard();

    return (
        <div className={classNames(styles.choiceRoot, activeCard ? styles.choiceRootActive : null)}>
            <h2 className={styles.title}>Choose:</h2>
            <div
                className={styles.cards}
                style={{
                    // @ts-expect-error CSS custom property
                    '--numCards': cardTypes.length,
                }}
            >
                {cardTypes.map((cardType, index) => (
                    <DraggableCard
                        key={cardType}
                        id={cardId}
                        elementId={`${cardId}-choice${index}`}
                        type={cardType}
                        index={index}
                        className={styles.card}
                    />
                ))}
            </div>

            <Button onClick={onCancel} className={styles.cancelButton}>Cancel</Button>
        </div>
    );
};

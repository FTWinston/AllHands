import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { Button } from 'common-ui/components/Button';
import { FC } from 'react';
import styles from './CardHand.module.css';
import { DraggableCard } from './DraggableCard';

type Props = {
    cardId: number;
    cardTypes: CardType[];
    onCancel: () => void;
};

export const CardChoice: FC<Props> = ({ cardId, cardTypes, onCancel }) => (
    <>
        <div
            className={styles.choice}
            style={{
            // @ts-expect-error CSS custom property
                '--numCards': cardTypes.length,
            }}
        >
            {cardTypes.map((cardType, index) => (
                <DraggableCard
                    key={cardType}
                    id={cardId}
                    type={cardType}
                    index={index}
                    className={styles.card}
                />
            ))}
        </div>

        <Button onClick={onCancel} style={{ position: 'relative', top: '20em' }}>Cancel</Button>
    </>
);

import { useEffect, useRef, useState } from 'react';
import { Card, CardProps } from 'common-ui/Card';
import styles from './CardHand.module.css';
import { classNames } from 'common-ui/classNames';

type WrapperProps = React.PropsWithChildren<{
    newlyAdding: boolean;
    index: number;
}>

const CardWrapper: React.FC<WrapperProps> = ({ children, newlyAdding, index }) => (
    <li
        className={classNames(styles.cardWrapper, newlyAdding ? styles.newlyAdding : null)}
        style={{
            // @ts-ignore
            '--index': index,
        }}
        tabIndex={0}
    >
        {children}
    </li>
);

type Props = {
    cards: CardProps[];
    onPlay: (index: number) => void;
}

function useHandCardIds(cards: CardProps[]) {
    const [handCardIds, setHandCardIds] = useState<number[]>(() => cards.map(card => card.id));
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const currentIds = cards.map(card => card.id);
        const idsToMark = currentIds.filter(id => !handCardIds.includes(id));
        const idsToRemove = handCardIds.filter(id => !currentIds.includes(id));
        if (idsToMark.length > 0 || idsToRemove.length > 0) {
            const frame = requestAnimationFrame(() => {
                setHandCardIds(prev => [...prev, ...idsToMark]
                    .filter(id => currentIds.includes(id))    
                );
            });
            return () => cancelAnimationFrame(frame);
        }
    }, [cards, handCardIds]);

    return handCardIds;
}

export const CardHandDisplay: React.FC<Props> = ({ cards }) => {
    const handCardIds = useHandCardIds(cards);

    return (
        <ul
            className={styles.hand}
            style={{
                // @ts-ignore
                '--numCards': cards.length,
            }}
        >
            {cards.map((card, index) => (
                <CardWrapper key={card.id} index={index} newlyAdding={!handCardIds.includes(card.id)}>
                    <Card {...card} />
                </CardWrapper>
            ))}
        </ul>
    );
};

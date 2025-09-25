import { Card, CardProps } from 'common-ui/Card';
import styles from './CardHand.module.css';

type Props = {
    cards: CardProps[];
    onPlay: (index: number) => void;
}

type WrapperProps = React.PropsWithChildren<{
    index: number;
    total: number;
}>

const CardWrapper: React.FC<WrapperProps> = ({ children, index, total }) => {
    let translateX = '0';
    if (total > 1) {
        const cardWidth = 8; // em
        const xStep = `min(7em, ((94vw - ${cardWidth}em) / ${total - 1}))`;
        translateX = `calc(${xStep} * ${index} - 47vw + ${cardWidth/2}em)`;
    }
    return (
        <li
            className={styles.cardWrapper}
            style={{
                zIndex: index,
                // @ts-ignore
                '--dx': translateX,
                '--dy': `${Math.abs(index - (total - 1) / 2) * 0.8}em`,
                '--r': `${(index - (total - 1) / 2) * 5}deg`,
                transform: `translateX(var(--dx)) rotate(var(--r)) translateY(var(--dy)) translateY(var(--extraY)) scale(var(--scale))`,
            }}
            tabIndex={0}
        >
            {children}
        </li>
    );
};

export const CardHandDisplay: React.FC<Props> = ({ cards }) => {
    return (
        <ul className={styles.hand}>
            {cards.map((card, index) => (
                <CardWrapper key={index} index={index} total={cards.length}>
                    <Card {...card} />
                </CardWrapper>
            ))}
        </ul>
    );
};

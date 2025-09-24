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
        const cardWidth = 11.2; // em
        const xStep = `min(10em, ((94vw - ${cardWidth}em) / ${total - 1}))`;
        translateX = `calc(${xStep} * ${index} - 47vw + ${cardWidth/2}em)`;
    }
    return (
        <div
            className={styles.cardWrapper}
            style={{
                zIndex: index,
                transform: `translateX(${translateX}) rotate(${(index - (total - 1) / 2) * 5}deg) translateY(${Math.abs(index - (total - 1) / 2) * 0.3}em)`,
            }}
        >
            {children}
        </div>
    );
};

export const CardHandDisplay: React.FC<Props> = ({ cards }) => {
    return (
        <div className={styles.hand}>
            {cards.map((card, index) => (
                <CardWrapper key={index} index={index} total={cards.length}>
                    <Card {...card} />
                </CardWrapper>
            ))}
        </div>
    );
};

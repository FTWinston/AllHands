import styles from './Card.module.css';
import { CrewRoleName } from 'common-types';
import { CardBase } from './CardBase';
import { classNames } from './classNames';

export type CardProps = {
    name: string;
    crew: CrewRoleName;
    description: string;
    image: React.ReactNode;
    cost: number;
    className?: string;
    nameFontSize?: number;
    descriptionLineHeight?: number;
};

export const Card: React.FC<CardProps> = (props) => {
    return (
        <CardBase className={classNames(styles.card, props.className)} crew={props.crew}>
            <div className={styles.image} role="presentation">{props.image}</div>
            <h3
                className={styles.name}
                style={props.nameFontSize ? { fontSize: `${props.nameFontSize}em` } : undefined}
            >
                {props.name}
            </h3>
            <div className={styles.cost}>{props.cost}</div>
            <p
                className={styles.description}
                style={props.descriptionLineHeight ? { lineHeight: `${props.descriptionLineHeight}em` } : undefined}
            >
                {props.description}
            </p>
        </CardBase>
    );
}
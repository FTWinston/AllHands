import { CardTargetType, CrewRoleName } from 'common-types';
import { FC, ReactNode } from 'react';
import styles from './Card.module.css';
import { CardBase } from './CardBase';
import { classNames } from './classNames';
import crewStyles from './CrewColors.module.css';
import { CardTargetIcon } from './icons/cardTargetTypes';

export type CardProps = {
    id: number;
    name: string;
    crew: CrewRoleName;
    targetType: CardTargetType;
    description: string;
    image: ReactNode;
    cost: number;
    className?: string;
    nameFontSize?: number;
    descriptionLineHeight?: number;
    hideStats?: boolean;
};

export const Card: FC<CardProps> = (props) => {
    return (
        <CardBase className={classNames(styles.card, crewStyles[props.crew], props.className)}>
            <div className={classNames(styles.image, props.hideStats ? styles.noCutouts : styles.cutouts)} role="presentation">{props.image}</div>
            <h3
                className={styles.name}
                style={props.nameFontSize ? { fontSize: `${props.nameFontSize}em` } : undefined}
            >
                {props.name}
            </h3>

            {props.hideStats ? null : <div className={styles.cost}>{props.cost}</div>}

            {props.hideStats ? null : <CardTargetIcon targetType={props.targetType} className={styles.targetType} />}

            <p
                className={styles.description}
                style={props.descriptionLineHeight ? { lineHeight: `${props.descriptionLineHeight}em` } : undefined}
            >
                {props.description}
            </p>
        </CardBase>
    );
};

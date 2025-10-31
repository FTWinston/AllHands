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
    className?: string;
    nameFontSize?: number;
    descriptionLineHeight?: number;
} & ({
    cost: number;
    slotted?: false;
} | {
    cost?: number;
    slotted: true;
});

export const Card: FC<CardProps> = (props) => {
    const hasCost = props.cost !== undefined;

    return (
        <CardBase className={classNames(styles.card, props.slotted ? styles.slotted : null, crewStyles[props.crew], props.className)}>
            <div className={classNames(styles.image, props.slotted ? (hasCost ? styles.noRightCutout : styles.noCutouts) : styles.cutouts)} role="presentation">{props.image}</div>
            <h3
                className={styles.name}
                style={props.nameFontSize ? { fontSize: `${props.nameFontSize}em` } : undefined}
            >
                {props.name}
            </h3>

            {props.slotted && !hasCost ? null : <div className={styles.cost}>{props.cost}</div>}

            {props.slotted ? null : <CardTargetIcon targetType={props.targetType} className={styles.targetType} />}

            <p
                className={styles.description}
                style={props.descriptionLineHeight ? { lineHeight: `${props.descriptionLineHeight}em` } : undefined}
            >
                {props.description}
            </p>
        </CardBase>
    );
};

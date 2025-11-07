import { CardTargetType, CrewRoleName } from 'common-types';
import { FC, ReactNode } from 'react';
import styles from './Card.module.css';
import { CardBase } from './CardBase';
import { classNames } from './classNames';
import crewStyles from './CrewColors.module.css';
import { CardTargetIcon } from './icons/cardTargetTypes';

type Props = {
    className?: string;
    slotted?: boolean;
    name: string;
    crew: CrewRoleName;
    targetType: CardTargetType;
    description: string;
    image: ReactNode;
    nameFontSize?: number;
    descriptionLineHeight?: number;
    cost: number;
};

export const CardDisplay: FC<Props> = (props) => {
    return (
        <CardBase className={classNames(styles.card, crewStyles[props.crew], props.className)}>
            <div className={classNames(styles.image, props.slotted ? styles.noCutouts : styles.cutouts)} role="presentation">{props.image}</div>
            <h3
                className={styles.name}
                style={props.nameFontSize ? { fontSize: `${props.nameFontSize}em` } : undefined}
            >
                {props.name}
            </h3>

            {props.slotted ? null : <div className={styles.cost}>{props.cost}</div>}

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

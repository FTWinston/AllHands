import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardTrait } from 'common-data/features/cards/types/CardTrait';
import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { FC, ReactNode } from 'react';
import crewStyles from '../../../CrewColors.module.css';
import { classNames } from '../../../utils/classNames';
import { CardTargetIcon } from '../assets/cardTargetTypes';
import styles from './Card.module.css';
import { CardBase } from './CardBase';
import { Trait } from './Trait';

type Props = {
    className?: string;
    slotted?: boolean;
    disabled?: boolean;
    name: string;
    crew: CrewRoleName;
    targetType: CardTargetType;
    description: string;
    image: ReactNode;
    nameFontSize?: number;
    descriptionLineHeight?: number;
    cost: number;
    sufficientPower?: boolean;
    traits?: CardTrait[];
};

export const CardDisplay: FC<Props> = (props) => {
    return (
        <CardBase className={classNames(
            styles.card,
            crewStyles[props.crew],
            props.disabled ? styles.disabled : undefined,
            props.sufficientPower === false ? styles.insufficientPower : undefined,
            props.className)}
        >
            <div className={classNames(styles.image, props.slotted ? styles.noCutouts : styles.cutouts)} role="presentation">{props.image}</div>
            <h3
                className={styles.name}
                style={props.nameFontSize ? { fontSize: `${props.nameFontSize}em` } : undefined}
            >
                {props.name}
            </h3>

            {props.slotted ? null : <div className={styles.cost}>{props.cost}</div>}

            {props.slotted ? null : <CardTargetIcon targetType={props.targetType} className={styles.targetType} />}

            {props.traits && props.traits.length > 0 && (
                <div className={styles.traits}>
                    {props.traits.map(trait => <Trait key={trait} type={trait} />)}
                </div>
            )}

            <p
                className={styles.description}
                style={props.descriptionLineHeight ? { lineHeight: `${props.descriptionLineHeight}em` } : undefined}
            >
                {props.description}
            </p>
        </CardBase>
    );
};

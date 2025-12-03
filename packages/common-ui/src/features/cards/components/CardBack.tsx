import { CrewRoleName } from 'common-types';
import { FC } from 'react';
import { CrewIcon } from '../../../icons/crew';
import { classNames } from '../../../utils/classNames';
import crewStyles from '../../CrewColors.module.css';
import styles from './CardBack.module.css';
import { CardBase } from './CardBase';

export type Props = {
    crew: CrewRoleName;
    className?: string;
};

export const CardBack: FC<Props> = (props) => {
    return (
        <CardBase className={classNames(styles.card, styles[props.crew], crewStyles[props.crew], props.className)}>
            <div className={styles.topSpacer} />
            <CrewIcon crew={props.crew} className={styles.crew} />
            <h3 className={styles.name}>{props.crew}</h3>
        </CardBase>
    );
};

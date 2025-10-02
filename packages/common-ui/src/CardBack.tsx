import { CrewRoleName } from 'common-types';
import { FC } from 'react';
import styles from './CardBack.module.css';
import { CardBase } from './CardBase';
import { classNames } from './classNames';
import { CrewIcon } from './icons/crew';

export type Props = {
    crew: CrewRoleName;
    className?: string;
};

export const CardBack: FC<Props> = (props) => {
    return (
        <CardBase className={classNames(styles.card, styles[props.crew], props.className)} crew={props.crew}>
            <div className={styles.topSpacer} />
            <CrewIcon crew={props.crew} className={styles.crew} />
            <h3 className={styles.name}>{props.crew}</h3>
        </CardBase>
    );
};

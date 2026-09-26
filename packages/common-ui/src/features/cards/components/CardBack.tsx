import { FC } from 'react';
import crewStyles from '../../../CrewColors.module.css';
import { SystemIcon } from '../../../icons/systems';
import { classNames } from '../../../utils/classNames';
import styles from './CardBack.module.css';
import { CardBase } from './CardBase';
import type { ShipSystem } from 'common-data/features/ships/types/ShipSystem';

export type Props = {
    system: ShipSystem;
    className?: string;
};

export const CardBack: FC<Props> = (props) => {
    return (
        <CardBase className={classNames(styles.card, styles[props.system], crewStyles[props.system], props.className)}>
            <div className={styles.topSpacer} />
            <SystemIcon system={props.system} className={styles.crew} />
            <h3 className={styles.name}>{props.system}</h3>
        </CardBase>
    );
};

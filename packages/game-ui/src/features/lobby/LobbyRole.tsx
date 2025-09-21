import { classNames } from 'common-ui';
import { JSX } from 'react';

import styles from './LobbyRole.module.css';

export type SystemState = 'unoccupied' | 'occupied' | 'ready';

export type Props = {
    icon: JSX.Element;
    name: string;
    state: SystemState;
};

export const LobbyRole: React.FC<Props> = (props) => {
    const { name, state } = props;

    return (
        <li className={classNames(styles.role, styles[state])}>
            <span className={styles.icon}>{props.icon}</span>
            <span className={styles.name}>{name}</span>
            {props.state !== 'unoccupied' && <span className={styles.state}>{state}</span>}
        </li>
    );
};

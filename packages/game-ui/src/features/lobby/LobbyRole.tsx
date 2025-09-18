import { classNames } from 'common-ui';

import styles from './LobbyRole.module.css';

export type SystemState = 'unoccupied' | 'occupied' | 'ready';

export type Props = {
    name: string;
    state: SystemState;
};

export const LobbyRole: React.FC<Props> = (props) => {
    const { name, state } = props;

    return (
        <li className={classNames(styles.role, styles[state])}>
            <span className={styles.name}>{name}</span>
            <span className={styles.state}>{state}</span>
        </li>
    );
};

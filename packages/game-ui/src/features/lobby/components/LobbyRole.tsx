import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import crewStyles from 'common-ui/CrewColors.module.css';
import { crewRoleLabels } from 'common-ui/features/crew/utils/crewRoleLabels';
import { SystemIcon } from 'common-ui/icons/systems';
import { classNames } from 'common-ui/utils/classNames';
import { FC } from 'react';

import styles from './LobbyRole.module.css';

export type SystemState = 'unoccupied' | 'occupied';

export type Props = {
    system: CrewRoleName;
    state: SystemState;
};

/** A station tile. An open station is outlined in dashes, like a sector map node that can be chosen, and fills in once crewed. */
export const LobbyRole: FC<Props> = (props) => {
    const { system, state } = props;
    const { name, description } = crewRoleLabels[system];

    return (
        <li className={classNames(styles.role, styles[state], crewStyles[system])}>
            <div className={styles.identity}>
                <span className={styles.icon}>
                    <SystemIcon system={system} />
                </span>
                <div className={styles.text}>
                    <h3 className={styles.name}>{name}</h3>
                    <p className={styles.description}>{description}</p>
                </div>
            </div>
            <p className={styles.state}>
                {state === 'occupied'
                    ? (
                        <>
                            <svg className={styles.check} viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M5 12.5l4.5 4.5L19 7.5" />
                            </svg>
                            Crewed
                        </>
                    )
                    : (
                        <>
                            <span className={styles.openDot} aria-hidden="true" />
                            Awaiting crew
                        </>
                    )}
            </p>
        </li>
    );
};

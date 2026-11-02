import { FC, PropsWithChildren, ReactNode } from 'react';
import { CrewStripe } from './CrewStripe';
import styles from './TopBar.module.css';

type Props = {
    /** Shown at the far end of the bar, e.g. readouts and buttons. */
    end?: ReactNode;
};

/** The bar across the top of a viewscreen: the game's name, then what this screen is, then any readouts or actions. */
export const TopBar: FC<PropsWithChildren<Props>> = props => (
    <header className={styles.topBar}>
        <div className={styles.brand}>
            <span className={styles.wordmark}>All Hands</span>
            <CrewStripe />
        </div>
        <span className={styles.divider} aria-hidden="true" />
        <div className={styles.content}>
            {props.children}
        </div>
        {props.end && <div className={styles.end}>{props.end}</div>}
    </header>
);

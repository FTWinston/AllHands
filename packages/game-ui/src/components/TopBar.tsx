import { FC, PropsWithChildren, ReactNode } from 'react';
import { CrewStripe } from './CrewStripe';
import styles from './TopBar.module.css';

type Props = {
    /** Show the game's name at the start of the bar. Only worth it before the game starts. */
    branded?: boolean;
    /** Shown at the far end of the bar, e.g. readouts and buttons. */
    end?: ReactNode;
};

/** The bar across the top of a viewscreen: optionally the game's name, then what this screen is, then any readouts or actions. */
export const TopBar: FC<PropsWithChildren<Props>> = props => (
    <header className={styles.topBar}>
        {props.branded && (
            <>
                <div className={styles.brand}>
                    <span className={styles.wordmark}>All Hands</span>
                    <CrewStripe />
                </div>
                <span className={styles.divider} aria-hidden="true" />
            </>
        )}
        <div className={styles.content}>
            {props.children}
        </div>
        {props.end && <div className={styles.end}>{props.end}</div>}
    </header>
);

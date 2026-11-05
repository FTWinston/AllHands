import { FC, PropsWithChildren, ReactNode } from 'react';
import styles from './TopBar.module.css';

type Props = {
    /** Shown at the start of the bar, e.g. a menu button or the game's name. */
    start?: ReactNode;
    /** Shown at the far end of the bar, e.g. readouts and buttons. */
    end?: ReactNode;
};

/** The bar across the top of a viewscreen: optionally something at its start, then what this screen is, then any readouts or actions. */
export const TopBar: FC<PropsWithChildren<Props>> = props => (
    <header className={styles.topBar}>
        {props.start}
        <div className={styles.content}>
            {props.children}
        </div>
        {props.end && <div className={styles.end}>{props.end}</div>}
    </header>
);

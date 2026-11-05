import { FC } from 'react';
import styles from './ChaseLights.module.css';

/**
 * Along the bottom edge of a viewscreen between encounters, two lights run in from the corners and meet in the middle.
 * Each is clipped at the middle, so the heads meet at full brightness and their tails follow them in.
 */
export const ChaseLights: FC = () => (
    <div className={styles.track} aria-hidden="true">
        <span className={styles.half}><span className={styles.light} /></span>
        <span className={styles.half}><span className={styles.light} /></span>
    </div>
);

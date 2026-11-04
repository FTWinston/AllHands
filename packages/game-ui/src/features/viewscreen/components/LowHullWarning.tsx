import { FC } from 'react';
import styles from './LowHullWarning.module.css';

type Props = {
    health: number;
    maxHealth: number;
};

/** Below this fraction of hull health, the viewscreen goes to red alert. */
const lowHullFraction = 0.25;

/** Red alert while the hull is close to failing: the screen's edges flash red a few times, then stay lit, with the hull's health at the top. */
export const LowHullWarning: FC<Props> = ({ health, maxHealth }) => {
    if (maxHealth <= 0 || health / maxHealth > lowHullFraction) {
        return null;
    }

    const percent = Math.max(0, Math.round((health / maxHealth) * 100));

    return (
        <div className={styles.warning} role="status" aria-label={`Red alert: hull at ${percent}%`}>
            <div className={styles.glow} />
            <div className={styles.edge} />
            <div className={`${styles.edge} ${styles.bottom}`} />
            <div className={styles.plate} aria-hidden="true">
                <span className={styles.plateTitle}>Red alert</span>
                <span className={styles.plateDivider} />
                <span className={styles.plateValue}>{`Hull ${percent}%`}</span>
            </div>
        </div>
    );
};

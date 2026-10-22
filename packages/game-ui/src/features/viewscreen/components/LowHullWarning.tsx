import { FC } from 'react';
import styles from './LowHullWarning.module.css';

type Props = {
    health: number;
    maxHealth: number;
};

/** Below this fraction of hull health, the viewscreen's edges pulse red. */
const lowHullFraction = 0.25;

/** A silent warning that the hull is close to failing: the edges of the screen slowly pulse red. */
export const LowHullWarning: FC<Props> = ({ health, maxHealth }) => {
    if (maxHealth <= 0 || health / maxHealth > lowHullFraction) {
        return null;
    }

    return <div className={styles.warning} role="status" aria-label="Hull integrity critical" />;
};

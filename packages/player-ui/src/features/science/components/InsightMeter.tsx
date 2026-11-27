import { systemEffectDefinitions } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { classNames } from 'common-ui/utils/classNames';
import { FC } from 'react';
import styles from './InsightMeter.module.css';

type Props = {
    /** How much Insight science holds. */
    insight: number;
};

/** The most Insight science can hold, which is how many pips the meter has. */
const maxInsight = systemEffectDefinitions.insight.maxLevel ?? 5;

/** Shows how much Insight science holds, as a row of pips, one lit for each point. */
export const InsightMeter: FC<Props> = ({ insight }) => {
    return (
        <div
            className={styles.insightMeter}
            role="meter"
            aria-label="Insight"
            aria-valuemin={0}
            aria-valuemax={maxInsight}
            aria-valuenow={insight}
        >
            <span className={styles.label}>Insight</span>

            <span className={styles.pips} aria-hidden="true">
                {Array.from({ length: maxInsight }, (_, index) => (
                    <span key={index} className={classNames(styles.pip, index < insight ? styles.pipLit : null)} />
                ))}
            </span>
        </div>
    );
};

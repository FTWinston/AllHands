import { getShieldAbsorption, ShieldTuning, shieldTuningBonus, shieldTuningPenalty } from 'common-data/features/ships/utils/shieldStats';
import { ShieldsIcon } from 'common-ui/icons/systems';
import { classNames } from 'common-ui/utils/classNames';
import { FC } from 'react';
import styles from './ShieldStatsSummary.module.css';

export type ShieldSummaryInfo = {
    capacity: number;
    level: number;
    /** The hull's power level, which sets how much of each hit the shields absorb. */
    power: number;
    tuning: ShieldTuning | null;
    /** Hull draws left before the shields can be tuned again. */
    scrambled: number;
};

const tuningNames: Record<ShieldTuning, string> = {
    energy: 'Energy',
    torpedo: 'Torpedoes',
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

function getTuningDetail(props: ShieldSummaryInfo) {
    if (props.scrambled > 0) {
        return `Scrambled for ${plural(props.scrambled, 'draw')}`;
    }

    return props.tuning
        ? `+${shieldTuningBonus}% vs these, −${shieldTuningPenalty}% vs others`
        : 'Until a tuning card is drawn';
}

/** The hull's shield stats, as worked out from its cards and power, and where its shields are now. */
export const ShieldStatsSummary: FC<ShieldSummaryInfo> = (props) => {
    return (
        <section className={styles.summary} aria-label="Shields">
            <dl className={styles.stats}>
                <div className={styles.stat}>
                    <dt className={styles.label}>Capacity</dt>
                    <dd className={styles.value}>{props.capacity}</dd>
                    <dd className={styles.detail}>from undamaged emitters</dd>
                </div>
                <div className={styles.stat}>
                    <dt className={styles.label}>Absorbs</dt>
                    <dd className={styles.value}>{`${getShieldAbsorption(props.power, props.capacity > 0 ? props.level / props.capacity : 0, null)}%`}</dd>
                    <dd className={styles.detail}>{props.power > 0 ? `of each hit now, at ${props.power} power` : 'No hull power'}</dd>
                </div>
                <div className={styles.stat}>
                    <dt className={styles.label}>Tuning</dt>
                    <dd className={classNames(styles.value, styles.wordValue)}>{props.tuning ? tuningNames[props.tuning] : 'None'}</dd>
                    <dd className={styles.detail}>{getTuningDetail(props)}</dd>
                </div>
            </dl>

            <p className={styles.state}>
                <ShieldsIcon className={styles.icon} />
                {` ${props.level} / ${props.capacity} · Recharges between encounters`}
            </p>
        </section>
    );
};

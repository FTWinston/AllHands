import { bracedPerLevel, getShieldAbsorption, reinforcedPerLevel, ShieldTuning, shieldTunings, tunedPerLevel } from 'common-data/features/ships/utils/shieldStats';
import { ShieldsIcon } from 'common-ui/icons/systems';
import { FC } from 'react';
import styles from './ShieldStatsSummary.module.css';

export type ShieldSummaryInfo = {
    capacity: number;
    level: number;
    /** The hull's power level, which sets how much of each hit the shields absorb. */
    power: number;
    /** Levels of the Reinforced hit bonus. */
    reinforced: number;
    /** Levels of the Braced hit bonus. */
    braced: number;
    /** Levels of tuning against each weapon type. */
    tuned: Record<ShieldTuning, number>;
    /** Hull draws left before they add hit bonuses again. */
    scrambled: number;
};

const tuningNames: Record<ShieldTuning, string> = {
    energy: 'energy',
    torpedo: 'torpedoes',
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

function getNextHitDetail(props: ShieldSummaryInfo) {
    if (props.scrambled > 0) {
        return `Scrambled for ${plural(props.scrambled, 'draw')}`;
    }

    const tunings = shieldTunings
        .filter(tuning => props.tuned[tuning] > 0)
        .map(tuning => `−${props.tuned[tuning] * tunedPerLevel} vs ${tuningNames[tuning]}`);

    return tunings.length > 0
        ? `and ${tunings.join(', ')}`
        : 'from hull cards drawn';
}

/** The hull's shield stats, as worked out from its cards and power, and where its shields are now. */
export const ShieldStatsSummary: FC<ShieldSummaryInfo> = (props) => {
    const nextHitReduction = props.reinforced * reinforcedPerLevel + props.braced * bracedPerLevel;

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
                    <dd className={styles.value}>{`${getShieldAbsorption(props.power, props.capacity > 0 ? props.level / props.capacity : 0)}%`}</dd>
                    <dd className={styles.detail}>{props.power > 0 ? `of each hit now, at ${props.power} power` : 'No hull power'}</dd>
                </div>
                <div className={styles.stat}>
                    <dt className={styles.label}>Next hit</dt>
                    <dd className={styles.value}>{nextHitReduction > 0 ? `−${nextHitReduction}` : '0'}</dd>
                    <dd className={styles.detail}>{getNextHitDetail(props)}</dd>
                </div>
            </dl>

            <p className={styles.state}>
                <ShieldsIcon className={styles.icon} />
                {` ${props.level} / ${props.capacity} · Recharges between encounters`}
            </p>
        </section>
    );
};

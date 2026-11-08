import { ShieldStats } from 'common-data/features/ships/utils/shieldStats';
import { ShieldsIcon } from 'common-ui/icons/systems';
import { FC } from 'react';
import styles from './ShieldStatsSummary.module.css';

export type ShieldSummaryInfo = {
    stats: ShieldStats;
    /** The hull's power level, which adds to the charge. */
    power: number;
    level: number;
    /** Undamaged hull draws left before the shields start recharging again. */
    recovering: number;
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** The hull's shield stats, as worked out from its cards, and where its shields are now. */
export const ShieldStatsSummary: FC<ShieldSummaryInfo> = (props) => {
    const { stats } = props;

    return (
        <section className={styles.summary} aria-label="Shields">
            <dl className={styles.stats}>
                <div className={styles.stat}>
                    <dt className={styles.label}>Capacity</dt>
                    <dd className={styles.value}>{stats.capacity}</dd>
                </div>
                <div className={styles.stat}>
                    <dt className={styles.label}>Charge</dt>
                    <dd className={styles.value}>
                        +
                        {stats.charge}
                    </dd>
                    <dd className={styles.detail}>
                        {props.power > 0
                            ? `${plural(stats.cardCharge, 'card')} + ${props.power} power`
                            : 'No hull power'}
                    </dd>
                </div>
                <div className={styles.stat}>
                    <dt className={styles.label}>Delay</dt>
                    <dd className={styles.value}>{stats.rechargeDelay}</dd>
                    <dd className={styles.detail}>draws after a hit</dd>
                </div>
            </dl>

            <p className={styles.state}>
                <ShieldsIcon className={styles.icon} />
                {` ${props.level} / ${stats.capacity} · `}
                {props.recovering > 0
                    ? `Recharges after ${plural(props.recovering, 'more undamaged draw')}`
                    : 'Recharging'}
            </p>
        </section>
    );
};

import { classNames } from 'common-ui/utils/classNames';
import styles from './ShieldBar.module.css';

/** The hull's shields. */
export type ShieldInfo = {
    level: number;
    max: number;
};

export const getShieldPercent = (shield: ShieldInfo) => (shield.max > 0 ? Math.round(shield.level / shield.max * 100) : 0);

/** The hull's shields as a bar, filling from the left. Decorative: describe it alongside. */
export const ShieldBar = (props: { shield: ShieldInfo; className?: string }) => (
    <span className={classNames(styles.bar, props.className)} aria-hidden="true">
        <span className={styles.fill} style={{ width: `${getShieldPercent(props.shield)}%` }} />
    </span>
);

/** The shields' percentage, with a smaller percent sign. */
export const ShieldPercent = (props: { shield: ShieldInfo; className?: string }) => (
    <span className={props.className}>
        {getShieldPercent(props.shield)}
        <span className={styles.percentSign}>%</span>
    </span>
);

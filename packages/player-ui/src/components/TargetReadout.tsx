import { classNames } from 'common-ui/utils/classNames';
import { PropsWithChildren } from 'react';
import styles from './TargetReadout.module.css';

type Props = PropsWithChildren<{
    label: string;
    /** Which side of the target card it sits on: its text lines up with that edge. */
    side: 'start' | 'end';
    className?: string;
}>;

/** A labelled value in a corner of a target card, such as a scanned target's shields. */
export const TargetReadout = ({ label, side, className, children }: Props) => (
    <div className={classNames(styles.root, side === 'end' ? styles.end : null, className)}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{children}</span>
    </div>
);

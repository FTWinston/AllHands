import { classNames } from 'common-ui/utils/classNames';
import { PropsWithChildren } from 'react';
import styles from './ScanSection.module.css';

type Props = PropsWithChildren<{
    label: string;
    className?: string;
}>;

export const ScanSection = ({ label, children, className }: Props) => (
    <div className={classNames(styles.root, className)}>
        <div className={styles.label}>{label}</div>
        {children}
    </div>
);

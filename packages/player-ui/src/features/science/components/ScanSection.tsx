import { classNames } from 'common-ui/utils/classNames';
import { PropsWithChildren, ReactNode } from 'react';
import styles from './ScanSection.module.css';

type Props = PropsWithChildren<{
    label: string;
    className?: string;
    /** Shown at the end of the row, after its value. */
    end?: ReactNode;
}>;

/** One labelled line of a scan readout. */
export const ScanSection = ({ label, children, className, end }: Props) => (
    <div className={classNames(styles.row, className)}>
        <ScanSectionContent label={label} end={end}>{children}</ScanSectionContent>
    </div>
);

/** The inside of a scan readout row, for rows that are themselves something else, such as a button. */
export const ScanSectionContent = ({ label, children, end }: Omit<Props, 'className'>) => (
    <>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{children}</span>
        {end}
    </>
);

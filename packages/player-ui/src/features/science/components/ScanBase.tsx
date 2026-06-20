import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { classNames } from 'common-ui/utils/classNames';
import { PropsWithChildren } from 'react';
import styles from './ScanBase.module.css';

type Props = PropsWithChildren<{
    className?: string;
    system?: ShipSystem;
    revealed?: boolean;
}>;

export const ScanBase = (props: Props) => {
    return (
        <li className={classNames(styles.root, props.revealed ? styles.revealed : styles.hidden, props.className)}>
            {props.system && (
                <div className={styles.systemName}>
                    {props.system}
                </div>
            )}
            {props.children}
        </li>
    );
};

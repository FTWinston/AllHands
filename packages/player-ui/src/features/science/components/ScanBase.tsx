import { classNames } from 'common-ui/utils/classNames';
import { PropsWithChildren } from 'react';
import styles from './ScanBase.module.css';

type Props = PropsWithChildren<{
    className?: string;
    expanded: boolean;
}>;

export const ScanBase = (props: Props) => {
    return (
        <li className={classNames(styles.root, props.expanded ? styles.expanded : styles.contracted, props.className)}>
            {props.children}
        </li>
    );
};

import { classNames } from 'common-ui/utils/classNames';
import { PropsWithChildren } from 'react';
import styles from './ScanBase.module.css';

type Props = PropsWithChildren<{
    className?: string;
}>;

export const ScanBase = (props: Props) => {
    return (
        <div className={classNames(styles.root, props.className)}>
            {props.children}
        </div>
    );
};

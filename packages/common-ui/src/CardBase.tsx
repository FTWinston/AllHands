import { FC, PropsWithChildren } from 'react';
import styles from './CardBase.module.css';
import { classNames } from './classNames';

export type Props = PropsWithChildren<{
    className?: string;
}>;

export const CardBase: FC<Props> = (props) => {
    return (
        <div className={classNames(styles.card, props.className)}>
            {props.children}
        </div>
    );
};

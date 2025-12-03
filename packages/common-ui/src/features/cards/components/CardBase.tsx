import { FC, PropsWithChildren } from 'react';
import { classNames } from '../../../utils/classNames';
import styles from './CardBase.module.css';

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

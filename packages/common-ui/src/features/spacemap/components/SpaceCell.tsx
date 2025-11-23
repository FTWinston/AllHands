import { FC, PropsWithChildren } from 'react';
import { classNames } from 'src/utils/classNames';
import styles from './SpaceCell.module.css';

type Props = PropsWithChildren<{
    className?: string;
    gridColumn?: string;
    gridRow?: string;
}>;

export const SpaceCell: FC<Props> = ({ gridColumn, gridRow, className, children }) => {
    return (
        <div
            className={classNames(styles.cell, className)}
            style={{ gridRow, gridColumn }}
        >
            {children}
        </div>
    );
};

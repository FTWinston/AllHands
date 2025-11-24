import { forwardRef, PropsWithChildren } from 'react';
import { classNames } from 'src/utils/classNames';
import styles from './SpaceCell.module.css';

type Props = PropsWithChildren<{
    className?: string;
    gridColumn?: string;
    gridRow?: string;
}>;

export const SpaceCell = forwardRef<HTMLDivElement, Props>(
    ({ gridColumn, gridRow, className, children }, ref) => {
        return (
            <div
                ref={ref}
                className={classNames(styles.cell, className)}
                style={{ gridRow, gridColumn }}
            >
                {children}
            </div>
        );
    }
);

import { FC } from 'react';
import { classNames } from '../utils/classNames';
import styles from './DiscreteProgress.module.css';

export type Props = {
    className?: string;
    vertical?: boolean;
    value: number;
    maxValue: number;
    title: string;
};

export const DiscreteProgress: FC<Props> = (props) => {
    const blockCount = Math.max(0, Math.floor(props.maxValue));
    const activeCount = Math.min(Math.max(0, Math.floor(props.value)), blockCount);

    return (
        <div
            className={classNames(styles.progress, props.vertical ? styles.vertical : undefined, props.className)}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={props.maxValue}
            aria-valuenow={props.value}
            title={props.title}
        >
            {Array.from({ length: blockCount }, (_, index) => (
                <div
                    key={index}
                    className={classNames(
                        styles.block,
                        index < activeCount ? styles.blockActive : undefined
                    )}
                />
            ))}
        </div>
    );
};

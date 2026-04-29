import { Cooldown } from 'common-data/types/Cooldown';
import { FC } from 'react';
import { classNames } from '../utils/classNames';
import styles from './DiscreteProgress.module.css';
import { LinearProgress } from './LinearProgress';

export type Props = {
    className?: string;
    vertical?: boolean;
    value: number;
    maxValue: number;
    title: string;
    decay?: Cooldown | null;
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
            {Array.from({ length: blockCount }, (_, index) => {
                const isActive = index < activeCount;
                const isLastActive = index === activeCount - 1;

                return (
                    <div
                        key={index}
                        className={classNames(
                            styles.block,
                            isActive ? styles.blockActive : undefined
                        )}
                    >
                        {isLastActive && (
                            <LinearProgress
                                progress={props.decay}
                                className={styles.decayProgress}
                                title="Losing charge"
                                direction={props.vertical ? 'down' : 'right'}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

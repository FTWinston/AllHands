import { Cooldown } from 'common-types';
import { FC } from 'react';
import { classNames } from '../utils/classNames';
import { useCooldownFraction } from '../hooks/useCooldownFraction';
import styles from './RadialProgress.module.css';

export type Props = {
    className?: string;
    progress?: Cooldown;
    visualAdjustment?: (fraction: number) => number;
    title: string;
};

export const RadialProgress: FC<Props> = (props) => {
    const generationProgress = useCooldownFraction(props.progress);

    const adjustedProgress = props.visualAdjustment?.(generationProgress) ?? generationProgress;

    return (
        <div
            className={classNames(styles.progress, props.className)}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(generationProgress * 100)}
            // @ts-expect-error CSS custom property
            style={{ '--fraction': adjustedProgress }}
            title={props.title}
        />
    );
};

import { Cooldown } from 'common-data/types/Cooldown';
import { FC } from 'react';
import { useCooldownFraction } from '../hooks/useCooldownFraction';
import { classNames } from '../utils/classNames';
import styles from './LinearProgress.module.css';

export type Props = {
    className?: string;
    progress?: Cooldown | null;
    direction: 'up' | 'down' | 'left' | 'right';
    title: string;
};

export const LinearProgress: FC<Props> = (props) => {
    const generationProgress = useCooldownFraction(props.progress);

    return (
        <div
            className={classNames(styles.progress, styles[props.direction], props.className)}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(generationProgress * 100)}
            // @ts-expect-error CSS custom property
            style={{ '--fraction': generationProgress }}
            title={props.title}
        />
    );
};

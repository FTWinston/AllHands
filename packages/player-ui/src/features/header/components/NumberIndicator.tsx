import { FC } from 'react';
import { useCooldownFraction } from 'src/hooks/useCooldown';
import { Cooldown } from 'src/types/Cooldown';
import styles from './NumberIndicator.module.css';

type Props = {
    value: number;
    maxValue: number;
    generation?: Cooldown;
    icon: FC<{ className: string }>;
};

export const NumberIndicator: FC<Props> = (props) => {
    const Icon = props.icon;
    const generationProgress = useCooldownFraction(props.generation);

    return (
        <div className={styles.indicatorRoot}>
            <Icon className={styles.icon} />

            <div className={styles.indicator}>
                <div
                    className={styles.progress}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(generationProgress * 100)}
                    // @ts-expect-error CSS custom property
                    style={{ '--fraction': generationProgress }}
                />

                <div className={styles.indicatorText}>
                    <span className={styles.currentValue}>{props.value}</span>
                    <span className={styles.separator}>/</span>
                    <span className={styles.maxValue}>{props.maxValue}</span>
                </div>
            </div>
        </div>
    );
};

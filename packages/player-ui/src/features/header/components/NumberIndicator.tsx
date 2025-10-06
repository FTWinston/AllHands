import { FC } from 'react';
import styles from './NumberIndicator.module.css';

type Props = {
    value: number;
    maxValue: number;
    generationProgress?: number;
    icon: FC<{ className: string }>;
};

export const NumberIndicator: FC<Props> = (props) => {
    const Icon = props.icon;

    return (
        <div className={styles.indicator}>
            <Icon className={styles.icon} />
            {' '}
            <div className={styles.indicatorText}>
                <span className={styles.currentValue}>{props.value}</span>
                {' '}
                <span className={styles.separator}>/</span>
                {' '}
                <span className={styles.maxValue}>{props.maxValue}</span>
            </div>
        </div>
    );
};

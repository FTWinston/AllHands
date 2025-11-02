import { classNames } from 'common-ui/classNames';
import React from 'react';
import styles from './RechargeIndicator.module.css';

export interface RechargeIndicatorProps {
    current: number;
    max: number;
}

export const RechargeIndicator: React.FC<RechargeIndicatorProps> = ({ current, max }) => {
    const segments = Math.max(1, max);
    const filled = Math.max(0, Math.min(current, max));
    return (
        <div className={styles.rechargeBarWrapper}>
            <div className={styles.rechargeBarHeader}>
                <span className={styles.rechargeBarLabel}>Recharging</span>
                <span className={styles.rechargeBarCount}>
                    {current}
                    /
                    {max}
                </span>
            </div>
            <div className={styles.rechargeBarSegments}>
                {Array.from({ length: segments }).map((_, i) => (
                    <div
                        key={i}
                        className={classNames(
                            styles.rechargeBarSegment,
                            i < filled ? styles.filled : styles.empty
                        )}
                    />
                ))}
            </div>
        </div>
    );
};

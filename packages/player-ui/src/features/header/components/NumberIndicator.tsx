import { classNames } from 'common-ui/index';
import { InfoPopup } from 'common-ui/InfoPopup';
import { FC } from 'react';
import { useCooldownFraction } from 'src/hooks/useCooldown';
import { Cooldown } from 'src/types/Cooldown';
import styles from './NumberIndicator.module.css';

type Props = {
    value: number;
    maxValue: number;
    generation?: Cooldown;
    valueName: string;
    valueDescription: string;
    maxName: string;
    maxDescription: string;
    valueIcon: FC<{ className: string }>;
    maxIcon: FC<{ className: string }>;
};

export const NumberIndicator: FC<Props> = (props) => {
    const ValueIcon = props.valueIcon;
    const MaxIcon = props.maxIcon;
    const generationProgress = useCooldownFraction(props.generation);

    return (
        <div className={styles.indicatorRoot}>
            <InfoPopup
                className={styles.indicator}
                name={props.valueName}
                description={props.valueDescription}
            >
                <ValueIcon className={styles.icon} />

                <div
                    className={styles.progress}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(generationProgress * 100)}
                    // @ts-expect-error CSS custom property
                    style={{ '--fraction': generationProgress }}
                />

                <div className={classNames(styles.indicatorText, styles.currentValue)}>
                    {props.value}
                </div>
            </InfoPopup>

            <div className={styles.separator}>/</div>

            <InfoPopup
                className={styles.indicator}
                name={props.maxName}
                description={props.maxDescription}
            >
                <MaxIcon className={styles.icon} />

                <div className={classNames(styles.indicatorText, styles.maxValue)}>
                    {props.maxValue}
                </div>
            </InfoPopup>
        </div>
    );
};

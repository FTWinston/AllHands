import { classNames } from 'common-ui/index';
import { InfoPopup } from 'common-ui/InfoPopup';
import { FC, JSX } from 'react';
import { useCooldownFraction } from 'src/hooks/useCooldown';
import { Cooldown } from 'src/types/Cooldown';
import styles from './NumberIndicator.module.css';

type Props = {
    value: number;
    maxValue: number;
    generation?: Cooldown;
    name: string;
    description: JSX.Element;
    valueIcon: FC<{ className: string }>;
    maxIcon: FC<{ className: string }>;
};

export const NumberIndicator: FC<Props> = (props) => {
    const ValueIcon = props.valueIcon;
    const MaxIcon = props.maxIcon;
    const generationProgress = useCooldownFraction(props.generation);

    return (
        <InfoPopup
            className={styles.indicatorRoot}
            name={props.name}
            description={props.description}
        >
            <div className={styles.indicator}>
                <ValueIcon className={styles.icon} />

                <div className={classNames(styles.indicatorText, styles.currentValue)}>
                    {props.value}
                </div>
            </div>

            <div className={styles.separator}>/</div>

            <div className={styles.indicator}>
                <MaxIcon className={styles.icon} />

                <div className={classNames(styles.indicatorText, styles.maxValue)}>
                    {props.maxValue}
                </div>
            </div>

            <div
                className={styles.progress}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(generationProgress * 100)}
                // @ts-expect-error CSS custom property
                style={{ '--fraction': generationProgress }}
            />
        </InfoPopup>
    );
};

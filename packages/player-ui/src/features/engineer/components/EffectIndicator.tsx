import { Cooldown } from 'common-types';
import { classNames } from 'common-ui/classNames';
import { InfoPopup } from 'common-ui/InfoPopup';
import { RadialProgress } from 'common-ui/RadialProgress';
import { FC, JSX } from 'react';
import styles from './EffectIndicator.module.css';

export type SystemEffect = {
    id: string;
    icon: FC<{ className: string }>;
    name: string;
    description: JSX.Element;
    duration?: Cooldown;
};

type Props = SystemEffect & {
    className?: string;
};

export const EffectIndicator = (props: Props) => {
    const Icon = props.icon;

    return (
        <InfoPopup
            className={classNames(styles.effect, props.className)}
            name={props.name}
            description={props.description}
        >
            <Icon className={styles.icon} />

            <RadialProgress
                className={styles.progress}
                progress={props.duration}
            />
        </InfoPopup>
    );
};

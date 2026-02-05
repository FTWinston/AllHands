import { Cooldown } from 'common-data/types/Cooldown';
import { InfoPopup } from 'common-ui/components/InfoPopup';
import { RadialProgress } from 'common-ui/components/RadialProgress';
import { classNames } from 'common-ui/utils/classNames';
import { ComponentType, JSX } from 'react';
import styles from './EffectIndicator.module.css';

type Props = {
    name: string;
    description: JSX.Element;
    positive: boolean;
    image: ComponentType<{ className?: string }>;
    className?: string;
    hidden?: boolean;
    progress?: Cooldown;
};

export const EffectIndicator = (props: Props) => {
    const Image = props.image;

    return (
        <InfoPopup
            className={classNames(styles.effect, props.hidden ? styles.hidden : undefined, props.className)}
            name={props.name}
            description={props.description}
            palette={props.positive ? 'good' : 'danger'}
        >
            <Image className={styles.icon} />

            <RadialProgress
                className={styles.progress}
                progress={props.progress}
                title={`${props.name} progress`}
            />
        </InfoPopup>
    );
};

import { Cooldown } from 'common-data/types/Cooldown';
import { InfoPopup } from 'common-ui/components/InfoPopup';
import { RadialProgress } from 'common-ui/components/RadialProgress';
import { EffectLevelContext } from 'common-ui/components/EffectLevelContext';
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
    progress?: Cooldown | null;
    level?: number;
    usesLevels?: boolean;
};

export const EffectIndicator = (props: Props) => {
    const Image = props.image;

    return (
        <EffectLevelContext.Provider value={{ level: props.level ?? 1, positive: props.positive }}>
            <InfoPopup
                className={classNames(styles.effect, props.hidden ? styles.hidden : undefined, props.className)}
                name={props.name}
                description={props.description}
                palette={props.positive ? 'good' : 'danger'}
            >
                <Image className={styles.icon} />

                {props.usesLevels && props.level !== undefined && props.level > 0 ? (
                    <span className={styles.level}>{props.level}</span>
                ) : null}

                <RadialProgress
                    className={styles.progress}
                    progress={props.progress}
                    title={`${props.name} progress`}
                />
            </InfoPopup>
        </EffectLevelContext.Provider>
    );
};

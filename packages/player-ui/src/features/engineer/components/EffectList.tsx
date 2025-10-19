import { classNames } from 'common-ui/classNames';
import { EffectIndicator, SystemEffect } from './EffectIndicator';
import styles from './EffectList.module.css';

type Props = {
    className?: string;
    effects: SystemEffect[] | undefined;
    isPositive: boolean;
};

export const EffectList = (props: Props) => {
    return (
        <div className={classNames(styles.effects, props.isPositive ? styles.positiveEffects : styles.negativeEffects, props.className)}>
            {props.effects?.map(effect => (
                <EffectIndicator
                    key={effect.id}
                    id={effect.id}
                    icon={effect.icon}
                    name={effect.name}
                    description={effect.description}
                    duration={effect.duration}
                />
            ))}
        </div>
    );
};

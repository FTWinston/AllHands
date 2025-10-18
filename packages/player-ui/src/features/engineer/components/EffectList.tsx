import { classNames } from 'common-ui/classNames';
import { Cooldown } from 'src/types/Cooldown';
import styles from './EffectList.module.css';

export type SystemEffect = {
    effect: string;
    description: string;
    duration?: Cooldown;
};

type Props = {
    className?: string;
    effects: SystemEffect[] | undefined;
    isPositive: boolean;
};

export const EffectList = (props: Props) => {
    return (
        <div className={classNames(styles.effects, props.isPositive ? styles.positiveEffects : styles.negativeEffects, props.className)}>

        </div>
    );
};

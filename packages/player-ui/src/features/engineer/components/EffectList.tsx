import { classNames } from 'common-ui/classNames';
import { EffectIndicator, SystemEffect } from './EffectIndicator';
import styles from './EffectList.module.css';

type Props = {
    className?: string;
    effects: SystemEffect[] | undefined;
};

export const EffectList = (props: Props) => {
    const count = props.effects?.length ?? 0;

    return (
        <ul
            className={classNames(styles.effects, props.className)}
            // @ts-expect-error CSS custom property
            style={{ '--count': count }}
        >
            {props.effects?.map((effect, index) => (
                <li
                    key={effect.id}
                    className={styles.effectItem}
                    // @ts-expect-error CSS custom property
                    style={{ '--index': index }}
                >
                    <EffectIndicator
                        id={effect.id}
                        icon={effect.icon}
                        positive={effect.positive}
                        name={effect.name}
                        description={effect.description}
                        duration={effect.duration}
                    />
                </li>
            ))}
        </ul>
    );
};

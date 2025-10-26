import { classNames } from 'common-ui/classNames';
import { useArrayChanges } from 'src/hooks/useArrayChanges';
import { EffectIndicator, SystemEffect } from './EffectIndicator';
import styles from './EffectList.module.css';

type Props = {
    className?: string;
    effects: SystemEffect[] | undefined;
};

export const EffectList = (props: Props) => {
    const { knownItems, currentItemIds, removingItemIds } = useArrayChanges(props.effects ?? []);

    return (
        <ul
            className={classNames(styles.effects, props.className)}
            // @ts-expect-error CSS custom property
            style={{ '--count': knownItems.length }}
        >
            {knownItems.map((effect, index) => (
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
                        hidden={removingItemIds.has(effect.id) || !currentItemIds.has(effect.id)}
                    />
                </li>
            ))}
        </ul>
    );
};

import { MinimalReadonlyArray } from 'common-data/types/MinimalArray';
import { classNames } from 'common-ui/utils/classNames';
import { SystemEffectInstance } from 'engine/effects/EngineSystemEffectDefinition';
import { useArrayChanges } from 'src/hooks/useArrayChanges';
import { getSystemEffectDefinition } from '../utils/getUiSystemEffectDefinition';
import { EffectIndicator } from './EffectIndicator';
import styles from './EffectList.module.css';

type Props = {
    className?: string;
    effects: MinimalReadonlyArray<SystemEffectInstance> | undefined;
};

const getEffectType = (effect: SystemEffectInstance) => effect.type;

export const EffectList = (props: Props) => {
    const { knownItems, currentItemIds, removingItemIds } = useArrayChanges(props.effects ?? [], getEffectType);

    return (
        <ul
            className={classNames(styles.effects, props.className)}
            // @ts-expect-error CSS custom property
            style={{ '--count': knownItems.length }}
        >
            {knownItems.map((effect, index) => {
                const definition = getSystemEffectDefinition(effect.type);

                return (
                    <li
                        key={effect.type}
                        className={styles.effectItem}
                        // @ts-expect-error CSS custom property
                        style={{ '--index': index }}
                    >
                        <EffectIndicator
                            image={definition.image}
                            positive={definition.positive}
                            name={definition.name}
                            description={definition.description}
                            progress={effect.progress}
                            hidden={removingItemIds.has(effect.type) || !currentItemIds.has(effect.type)}
                        />
                    </li>
                );
            })}
        </ul>
    );
};

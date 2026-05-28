import { SystemEffectPolarity } from 'common-data/features/ships/types/SystemEffectDefinition';
import { createContext, FC, useContext } from 'react';
import styles from './EffectLevelContext.module.css';

export type EffectLevelContextValue = {
    level: number;
    polarity: SystemEffectPolarity;
};

export const EffectLevelContext = createContext<EffectLevelContextValue | undefined>(undefined);

function getClassNameForPolarity(polarity: SystemEffectPolarity): string {
    if (polarity === SystemEffectPolarity.Neutral) {
        return styles.neutral;
    }
    return polarity === SystemEffectPolarity.Positive ? styles.positive : styles.negative;
}

export const EffectLevel: FC = () => {
    const ctx = useContext(EffectLevelContext);
    const level = ctx?.level ?? 1;
    const polarity = ctx?.polarity ?? SystemEffectPolarity.Negative;
    return (
        <strong className={getClassNameForPolarity(polarity)}>
            {level}
        </strong>
    );
};

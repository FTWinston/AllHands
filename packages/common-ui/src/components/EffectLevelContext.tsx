import { SystemEffectPolarity } from 'common-data/features/ships/types/SystemEffectDefinition';
import { createContext, FC, useContext } from 'react';
import styles from './EffectLevelContext.module.css';

export type EffectLevelContextValue = {
    level: number;
    polarity: SystemEffectPolarity;
};

export const EffectLevelContext = createContext<EffectLevelContextValue | undefined>(undefined);

function getClassNameForPolarity(polarity: SystemEffectPolarity | null | undefined): string {
    if (polarity === SystemEffectPolarity.Positive) {
        return styles.positive;
    }
    if (polarity === SystemEffectPolarity.Negative) {
        return styles.negative;
    }
    return styles.neutral;
}

export const EffectLevel: FC = () => {
    const ctx = useContext(EffectLevelContext);
    const level = ctx?.level ?? 1;
    return (
        <strong className={getClassNameForPolarity(ctx?.polarity)}>
            {level}
        </strong>
    );
};

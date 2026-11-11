import { SystemEffectCategory } from 'common-data/features/ships/types/SystemEffectDefinition';
import { createContext, FC, useContext } from 'react';
import styles from './EffectLevelContext.module.css';

export type EffectLevelContextValue = {
    level: number;
    category: SystemEffectCategory;
};

export const EffectLevelContext = createContext<EffectLevelContextValue | undefined>(undefined);

function getClassNameForCategory(category: SystemEffectCategory | null | undefined): string {
    if (category === SystemEffectCategory.Positive) {
        return styles.positive;
    }
    if (category === SystemEffectCategory.Negative) {
        return styles.negative;
    }
    return styles.neutral;
}

export const EffectLevel: FC = () => {
    const ctx = useContext(EffectLevelContext);
    const level = ctx?.level ?? 1;
    return (
        <strong className={getClassNameForCategory(ctx?.category)}>
            {level}
        </strong>
    );
};

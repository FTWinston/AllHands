import { SystemEffectCategory } from 'common-data/features/ships/types/SystemEffectDefinition';
import { createContext, FC, useContext } from 'react';
import styles from './EffectLevelContext.module.css';

export type EffectLevelContextValue = {
    level: number;
    /** Set when the effect's max level varies by ship. */
    maxLevel?: number;
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

/** An effect's max level, for effects whose max level varies by ship, such as shields. */
export const EffectMaxLevel: FC = () => {
    const ctx = useContext(EffectLevelContext);
    return (
        <strong className={styles.neutral}>
            {ctx?.maxLevel ?? '?'}
        </strong>
    );
};

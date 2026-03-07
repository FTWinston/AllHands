import { createContext, FC, useContext } from 'react';
import styles from './EffectLevelContext.module.css';

export type EffectLevelContextValue = {
    level: number;
    positive: boolean;
};

export const EffectLevelContext = createContext<EffectLevelContextValue | undefined>(undefined);

export const EffectLevel: FC = () => {
    const ctx = useContext(EffectLevelContext);
    const level = ctx?.level ?? 1;
    const positive = ctx?.positive ?? false;
    return (
        <strong className={positive ? styles.positive : styles.negative}>
            {level}
        </strong>
    );
};

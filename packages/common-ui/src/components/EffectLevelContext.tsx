import { createContext, FC, useContext } from 'react';

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
        <strong style={{ color: positive ? 'var(--good-light)' : 'var(--danger-light)' }}>
            {level}
        </strong>
    );
};

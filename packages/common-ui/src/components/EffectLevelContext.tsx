import { createContext, FC, useContext } from 'react';

export const EffectLevelContext = createContext<number | undefined>(undefined);

export const EffectLevel: FC = () => {
    // Default to 1: the minimum level, used when no context provider is present (e.g. in static previews).
    const level = useContext(EffectLevelContext) ?? 1;
    return <>{level}</>;
};

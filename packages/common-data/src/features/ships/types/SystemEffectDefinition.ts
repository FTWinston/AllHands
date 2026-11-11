import { Cooldown } from 'src/types/Cooldown';
import { SystemEffectType } from '../utils/systemEffectDefinitions';

export interface SystemEffectDefinition {
    category: SystemEffectCategory;
    duration?: number;
    usesLevels: boolean;
    maxLevel?: number;
    tickInterval?: number;
}

export enum SystemEffectCategory {
    Negative = -1,
    Neutral = 0,
    Positive = 1,
}

export type SystemEffectInstance = {
    type: SystemEffectType;
    progress: Cooldown | null;
    level?: number;
};

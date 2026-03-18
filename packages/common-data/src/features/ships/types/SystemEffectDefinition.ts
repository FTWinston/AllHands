import { Cooldown } from 'src/types/Cooldown';
import { SystemEffectType } from '../utils/systemEffectDefinitions';

export interface SystemEffectDefinition {
    positive: boolean;
    duration?: number;
    usesLevels: boolean;
    maxLevel?: number;
    tickInterval?: number;
}

export type SystemEffectInstance = {
    type: SystemEffectType;
    progress: Cooldown | null;
    level?: number;
};

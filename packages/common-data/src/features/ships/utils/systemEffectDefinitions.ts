import { sharedContent } from 'content/content.shared';
import { mergeSharedContent, type MergedEffects } from '../../../content/SharedContent';

export { MAX_POWER_LEVEL } from './powerLevel';

type AllEffects = MergedEffects<(typeof sharedContent)[number]>;

/** Every status effect there is. Each is defined in the `*.shared.ts` file of the content folder it belongs to. */
export const systemEffectDefinitions = mergeSharedContent(sharedContent, 'effects') as AllEffects;

export type SystemEffectType = Extract<keyof AllEffects, string>;

export type LeveledSystemEffectType = {
    [K in SystemEffectType]: AllEffects[K]['usesLevels'] extends true ? K : never
}[SystemEffectType];

export type NonLeveledSystemEffectType = Exclude<SystemEffectType, LeveledSystemEffectType>;

export function isLeveledSystemEffectType(effectType: SystemEffectType): effectType is LeveledSystemEffectType {
    return systemEffectDefinitions[effectType].usesLevels;
}

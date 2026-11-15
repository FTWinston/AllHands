import { systemEffectDefinitions } from 'common-data/features/ships/utils/systemEffectDefinitions';

/** The most Lock that can be held against a ship. */
export const maxLockLevel = systemEffectDefinitions.lock.maxLevel;

/** A row of pips showing a level of Lock out of the most there can be: filled for each level held, hollow for the rest. */
export function getLockPips(level: number, maxLevel = maxLockLevel): string {
    const filled = Math.max(0, Math.min(maxLevel, Math.floor(level)));
    return '●'.repeat(filled) + '○'.repeat(maxLevel - filled);
}

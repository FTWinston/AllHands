import { SystemEffectDefinition } from 'common-data/features/ships/types/SystemEffectDefinition';
import { EngineerSystemTile } from 'src/state/systems/engineer/EngineerSystemTile';

/**
 * Why an effect is being removed, which can change what it does as it goes:
 * - expired: it ran its time, or was taken off in the ordinary way.
 * - early: something cut it short, such as a purge or a reset.
 * - cleared: every effect is being swept away together, at the end of an encounter or on a full repair.
 */
export type EffectRemoval = 'expired' | 'early' | 'cleared';

export type SystemEffectFunctionality = {
    apply: (system: EngineerSystemTile, level: number) => boolean;
    /** Undoes whatever the effect did. What else it does can depend on why it's going (see `EffectRemoval`). */
    remove: (system: EngineerSystemTile, removal: EffectRemoval, level: number) => void;
    onLevelChanged?: (system: EngineerSystemTile, newLevel: number, oldLevel: number) => void;
    tick?: (system: EngineerSystemTile, level: number) => void;
};

export type EngineSystemEffectDefinition = SystemEffectFunctionality & SystemEffectDefinition;

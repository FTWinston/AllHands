import { SystemEffectDefinition } from 'common-data/features/ships/types/SystemEffectDefinition';
import { EngineerSystemTile } from 'src/state/systems/engineer/EngineerSystemTile';

export type SystemEffectFunctionality = {
    apply: (system: EngineerSystemTile, level: number) => boolean;
    remove: (system: EngineerSystemTile, early: boolean, level: number) => void;
    /**
     * What the effect does when it's cleared away with every other, at the end of an encounter or on a full repair.
     * Without this, it does what it would on wearing off (`remove`, not early), which undoes whatever it did.
     */
    clear?: (system: EngineerSystemTile, level: number) => void;
    onLevelChanged?: (system: EngineerSystemTile, newLevel: number, oldLevel: number) => void;
    tick?: (system: EngineerSystemTile, level: number) => void;
};

export type EngineSystemEffectDefinition = SystemEffectFunctionality & SystemEffectDefinition;

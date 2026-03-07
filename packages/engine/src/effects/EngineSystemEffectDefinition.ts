import { SystemEffectDefinition } from 'common-data/features/ships/types/SystemEffectDefinition';
import { EngineerSystemTile } from 'src/state/EngineerSystemTile';

export type SystemEffectFunctionality = {
    apply: (system: EngineerSystemTile, level?: number) => boolean;
    remove: (system: EngineerSystemTile, early: boolean, level?: number) => void;
    onLevelChanged?: (system: EngineerSystemTile, newLevel: number, oldLevel: number) => void;
};

export type EngineSystemEffectDefinition = SystemEffectFunctionality & SystemEffectDefinition;

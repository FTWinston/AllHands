import { SystemEffectDefinition } from 'common-data/features/ships/types/SystemEffectDefinition';
import { EngineerSystemTile } from 'src/state/EngineerSystemTile';

export type SystemEffectFunctionality = {
    apply: (system: EngineerSystemTile) => boolean;
    remove: (system: EngineerSystemTile, early: boolean) => void;
};

export type EngineSystemEffectDefinition = SystemEffectFunctionality & SystemEffectDefinition;

import { SystemEffectDefinition } from 'common-data/features/ships/types/SystemEffectDefinition';
import { SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { Cooldown } from 'common-data/types/Cooldown';
import { EngineerSystemTile } from 'src/state/EngineerState';

export type SystemEffectFunctionality = {
    apply: (system: EngineerSystemTile) => boolean;
    remove: (system: EngineerSystemTile, early: boolean) => void;
};

export type EngineSystemEffectDefinition = SystemEffectFunctionality & SystemEffectDefinition;

export type SystemEffectInstance = {
    type: SystemEffectType;
    progress?: Cooldown;
};

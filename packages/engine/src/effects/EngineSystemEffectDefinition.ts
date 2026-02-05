import { SystemEffectDefinition } from 'common-data/features/ships/types/SystemEffectDefinition';
import { SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { Cooldown } from 'common-data/types/Cooldown';
import { GameState } from 'src/state/GameState';
import { Ship } from 'src/state/Ship';

export type SystemEffectFunctionality = {
    apply: (gameState: GameState, ship: Ship) => boolean;
    remove: (gameState: GameState, ship: Ship, early: boolean) => void;
};

export type EngineSystemEffectDefinition = SystemEffectFunctionality & SystemEffectDefinition;

export type SystemEffectInstance = {
    type: SystemEffectType;
    progress?: Cooldown;
};

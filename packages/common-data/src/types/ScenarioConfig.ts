import type { Encounter } from '../features/space/types/Encounter';
import type { PlayerShipSetupInfo } from '../features/space/types/GameObjectInfo';

/**
 * Lookup name for a GameRules implementation class.
 * The GameRoom uses this to decide which rules class to instantiate.
 */
export type RulesType = 'endlessCombat';

export type ScenarioConfig = {
    /** Human-readable name for this scenario. */
    name: string;
    /** Optional description of the scenario. */
    description?: string;
    /** Which GameRules implementation to use. */
    rules: RulesType;
    /** Setup info for the player's ship. */
    player: PlayerShipSetupInfo;
    /** Array of encounters in this scenario. */
    encounters: Encounter[];
};

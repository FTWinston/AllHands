import type { Encounter } from '../features/space/types/Encounter';
import type { PlayerShipSetupInfo } from '../features/space/types/GameObjectInfo';

export type GameMode = 'survival' | 'adventure';

export type ScenarioConfig = {
    /** Human-readable name for this scenario. */
    name: string;
    /** Optional description of the scenario. */
    description?: string;
    gameMode: GameMode;
    /** Setup info for the player's ship. */
    player: PlayerShipSetupInfo;
    /** Array of encounters in this scenario. */
    encounters: Encounter[];
};

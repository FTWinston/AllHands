import { getPlayerShips } from 'src/utils/shipQueries';
import { Encounter } from './Encounter';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { GameState } from 'src/state/GameState';

/** No hostiles and no objective: fully repairs every player ship on arrival, and is complete straight away. */
export class RepairStationEncounter extends Encounter {
    constructor(state: GameState, node: SectorNodeInfo) {
        super(state, { ...node, kind: 'repair', objective: undefined, factionId: undefined });
    }

    protected populate(): void {
        for (const ship of getPlayerShips(this.state)) {
            ship.fullyRepair();
        }
    }
}

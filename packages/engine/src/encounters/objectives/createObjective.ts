import { BossObjective } from './BossObjective';
import { DestroyAllObjective } from './DestroyAllObjective';
import { SurviveObjective } from './SurviveObjective';
import type { Objective } from './Objective';
import type { ObjectiveInfo } from 'common-data/features/sectors/types/ObjectiveInfo';
import type { GameState } from 'src/state/GameState';

export function createObjective(info: ObjectiveInfo, state: GameState): Objective {
    switch (info.type) {
        case 'destroyAll':
            return new DestroyAllObjective(state);
        case 'survive':
            return new SurviveObjective(state, info.durationMs);
        case 'boss':
            return new BossObjective(state);
        default:
            throw new Error(`Objective type not found: ${info satisfies never}`);
    }
}

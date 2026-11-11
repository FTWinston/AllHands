import { BossEncounter } from './BossEncounter';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { GameState } from 'src/state/GameState';

export class BossAEncounter extends BossEncounter {
    constructor(state: GameState, node: SectorNodeInfo) {
        super(state, node, { bossName: 'Boss A', escorts: ['harrier', 'harrier'] });
    }
}

export class BossBEncounter extends BossEncounter {
    constructor(state: GameState, node: SectorNodeInfo) {
        super(state, node, { bossName: 'Boss B', escorts: ['fighter', 'harrier'] });
    }
}

export class BossCEncounter extends BossEncounter {
    constructor(state: GameState, node: SectorNodeInfo) {
        super(state, node, { bossName: 'Boss C', escorts: ['bulwark', 'fighter'] });
    }
}

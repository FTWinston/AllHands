import { BossEncounter } from './BossEncounter';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { GameState } from 'src/state/GameState';

export class RaiderWarlordEncounter extends BossEncounter {
    constructor(state: GameState, node: SectorNodeInfo) {
        super(state, node, { bossName: 'Warlord Kragg\'s Maw', escorts: ['scout', 'scout'] });
    }
}

export class CartelSyndicateBossEncounter extends BossEncounter {
    constructor(state: GameState, node: SectorNodeInfo) {
        super(state, node, { bossName: 'Golden Toll', escorts: ['fighter', 'scout'] });
    }
}

export class HegemonyAdmiralEncounter extends BossEncounter {
    constructor(state: GameState, node: SectorNodeInfo) {
        super(state, node, { bossName: 'Dominion of Steel', escorts: ['heavy', 'fighter'] });
    }
}

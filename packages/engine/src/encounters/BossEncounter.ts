import { spawnEnemies, type EnemySpawn } from './CombatEncounter';
import { Encounter } from './Encounter';
import { bossScenarioId } from './objectives/BossObjective';
import type { EnemyRole } from '../campaign/enemyTemplates';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { GameState } from 'src/state/GameState';

export interface BossConfig {
    /** The boss ship's name. */
    bossName: string;
    /** Ships that guard the boss; they hunt the player if it dies. */
    escorts: readonly EnemyRole[];
}

/** A flagship plus escorts; complete when the flagship is destroyed (the escorts may still be alive). */
export class BossEncounter extends Encounter {
    constructor(state: GameState, node: SectorNodeInfo, private readonly config: BossConfig) {
        super(state, { ...node, kind: 'boss', objective: { type: 'boss' } });
    }

    protected populate(): void {
        const spawns: EnemySpawn[] = [
            { role: 'flagship', scenarioId: bossScenarioId, name: this.config.bossName },
            ...this.config.escorts.map((role): EnemySpawn => ({ role, guards: bossScenarioId })),
        ];

        this.spawnObjects(spawnEnemies(this.state, this.factionId, spawns));
    }
}

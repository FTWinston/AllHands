import { spawnEnemies, type EnemySpawn } from './CombatEncounter';
import { Encounter } from './Encounter';
import type { EnemyRole } from '../campaign/enemyTemplates';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { GameObject } from 'src/state/GameObject';
import type { GameState } from 'src/state/GameState';

/** The scenario id the boss ship is spawned with, which the encounter watches. */
export const bossScenarioId = 'boss';

export interface BossConfig {
    /** The boss ship's name. */
    bossName: string;
    /** Ships that guard the boss; they hunt the player if it dies. */
    escorts: readonly EnemyRole[];
}

/** A flagship plus escorts; complete when the flagship is destroyed (the escorts may still be alive). */
export class BossEncounter extends Encounter {
    private boss: GameObject | undefined;

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

    override start(): void {
        super.start();

        this.boss = this.state.getObjectByScenarioId(bossScenarioId);
        if (!this.boss) {
            throw new Error('Boss encounter requires a ship spawned with the boss scenario id');
        }
    }

    override onObjectRemoved(object: GameObject): void {
        if (object === this.boss) {
            this.complete();
        }
    }
}

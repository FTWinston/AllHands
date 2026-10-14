import { spawnEnemies, type EnemySpawn } from './CombatEncounter';
import { Encounter } from './Encounter';
import { getHostileShips } from './hostiles';
import type { EnemyRole } from '../campaign/enemyTemplates';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { GameState } from 'src/state/GameState';

export const defaultSurviveDurationMs = 60_000;
const reinforcementIntervalMs = 12_000;
const maxSimultaneousHostiles = 4;
const reinforcementRoles: readonly EnemyRole[] = ['scout', 'fighter', 'scout', 'heavy'];

/**
 * Hold out for a set time. Hostiles keep arriving while the timer runs (up to a cap on how many
 * are alive at once); whatever is left when the timer ends does not have to be destroyed.
 */
export class SurviveEncounter extends Encounter {
    private sinceLastWave = 0;

    constructor(state: GameState, node: SectorNodeInfo) {
        super(state, {
            ...node,
            objective: node.objective?.type === 'survive' ? node.objective : { type: 'survive', durationMs: defaultSurviveDurationMs },
        });
    }

    protected populate(): void {
        const opening: EnemySpawn[] = [{ role: 'fighter' }, { role: 'scout' }];
        this.spawnObjects(spawnEnemies(this.state, this.factionId, opening));
    }

    override tick(deltaTime: number): void {
        super.tick(deltaTime);

        if (this.isComplete) {
            return;
        }

        this.sinceLastWave += deltaTime;
        if (this.sinceLastWave < reinforcementIntervalMs) {
            return;
        }

        this.sinceLastWave = 0;

        if (getHostileShips(this.state).length < maxSimultaneousHostiles) {
            const role = this.state.random.pick(reinforcementRoles);
            this.spawnObjects(spawnEnemies(this.state, this.factionId, [{ role }]));
        }
    }
}

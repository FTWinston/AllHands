import { getHostileShips } from 'src/utils/shipQueries';
import { hostileToPlayer } from '../campaign/factions';
import { hostileFaction, spawnEnemies, withEliteReinforcements, type EnemySpawn } from './CombatEncounter';
import { Encounter } from './Encounter';
import type { ShipDesign } from '../campaign/shipDesigns';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { GameState } from 'src/state/GameState';

export const defaultSurviveDurationMs = 60_000;
const reinforcementIntervalMs = 12_000;
const maxSimultaneousHostiles = 4;
const reinforcementDesigns: readonly ShipDesign[] = ['harrier', 'fighter', 'harrier', 'bulwark'];

/**
 * Hold out for a set time. Hostiles keep arriving while the timer runs (up to a cap on how many
 * are alive at once); whatever is left when the timer ends does not have to be destroyed.
 */
export class SurviveEncounter extends Encounter {
    protected override readonly factions = [hostileToPlayer(hostileFaction)];
    private sinceLastWave = 0;
    private endTime = 0;
    private started = false;
    private readonly durationMs: number;

    constructor(state: GameState, node: SectorNodeInfo) {
        const objective = node.objective?.type === 'survive' ? node.objective : { type: 'survive' as const, durationMs: defaultSurviveDurationMs };
        super(state, { ...node, objective });
        this.durationMs = objective.durationMs;
    }

    override get objectiveEndTime(): number {
        return this.endTime;
    }

    override start(): void {
        super.start();
        this.endTime = this.state.currentTime + this.durationMs;
        this.started = true;
    }

    protected populate(): void {
        const opening: EnemySpawn[] = [{ design: 'fighter' }, { design: 'harrier' }];
        this.spawnObjects(spawnEnemies(this.state, hostileFaction, withEliteReinforcements(this.node, opening)));
    }

    override tick(deltaTime: number): void {
        if (this.started && this.state.currentTime >= this.endTime) {
            this.complete();
        }

        if (this.isComplete) {
            return;
        }

        this.sinceLastWave += deltaTime;
        if (this.sinceLastWave < reinforcementIntervalMs) {
            return;
        }

        this.sinceLastWave = 0;

        if (getHostileShips(this.state).length < maxSimultaneousHostiles) {
            const design = this.state.random.pick(reinforcementDesigns);
            this.spawnObjects(spawnEnemies(this.state, hostileFaction, [{ design }]));
        }
    }
}

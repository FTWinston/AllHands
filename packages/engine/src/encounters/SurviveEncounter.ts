import { getHostileShips } from 'src/utils/shipQueries';
import { hostileToPlayer } from '../campaign/factions';
import { hostileFaction, withEliteReinforcements } from './CombatEncounter';
import { Encounter } from './Encounter';
import type { EncounterDefinition } from './EncounterDefinition';
import type { ShipSpawn } from './shipSpawns';
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
    private endTime = 0;
    private readonly durationMs: number;

    constructor(state: GameState, node: SectorNodeInfo) {
        // How long to hold out for varies from node to node (see `SectorGenerator`).
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
        this.after(this.durationMs, () => this.complete());
        this.every(reinforcementIntervalMs, () => this.reinforce());
    }

    protected populate(): void {
        const opening: ShipSpawn[] = [{ design: 'fighter' }, { design: 'harrier' }];
        this.spawnShips(hostileFaction, withEliteReinforcements(this.node, opening));
    }

    private reinforce(): void {
        if (getHostileShips(this.state).length < maxSimultaneousHostiles) {
            this.spawnShips(hostileFaction, [{ design: this.state.random.pick(reinforcementDesigns) }]);
        }
    }
}

export const surviveDefinition: EncounterDefinition = {
    id: 'survive',
    name: 'Hold Out',
    kind: 'combat',
    objective: { type: 'survive', durationMs: defaultSurviveDurationMs },
    defaultEnvironment: 'asteroidField',
    create: (state, node) => new SurviveEncounter(state, node),
};

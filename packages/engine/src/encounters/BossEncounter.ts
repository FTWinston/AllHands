import { hostileToPlayer } from '../campaign/factions';
import { hostileFaction } from './CombatEncounter';
import { Encounter } from './Encounter';
import type { EncounterDefinition } from './EncounterDefinition';
import type { ShipDesign } from '../campaign/shipDesigns';
import type { EnvironmentType } from 'common-data/features/sectors/types/EnvironmentType';
import type { EncounterId, SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { GameObject } from 'src/state/GameObject';
import type { GameState } from 'src/state/GameState';

/** The scenario id the boss ship is spawned with, which its escorts guard. */
export const bossScenarioId = 'boss';

export interface BossConfig {
    /** The boss ship's name. */
    bossName: string;
    /** Ships that guard the boss; they hunt the player if it dies. */
    escorts: readonly ShipDesign[];
}

/** A flagship plus escorts; complete when the flagship is destroyed (the escorts may still be alive). */
export class BossEncounter extends Encounter {
    protected override readonly factions = [hostileToPlayer(hostileFaction)];
    private boss: GameObject | undefined;

    constructor(state: GameState, node: SectorNodeInfo, private readonly config: BossConfig) {
        super(state, node);
    }

    protected populate(): void {
        [this.boss] = this.spawnShips(hostileFaction, [
            { design: 'flagship', scenarioId: bossScenarioId, name: this.config.bossName },
            ...this.config.escorts.map(design => ({ design, guards: bossScenarioId })),
        ]);
    }

    protected override onObjectRemoved(object: GameObject): void {
        if (object === this.boss) {
            this.complete();
        }
    }
}

function bossDefinition(id: EncounterId, name: string, defaultEnvironment: EnvironmentType, config: BossConfig): EncounterDefinition {
    return { id, name, kind: 'boss', objective: { type: 'boss' }, defaultEnvironment, create: (state, node) => new BossEncounter(state, node, config) };
}

/** Placeholder bosses, one per sector, until the campaign is written. */
export const bossDefinitions: readonly EncounterDefinition[] = [
    bossDefinition('bossA', 'Placeholder Boss A', 'asteroidField', { bossName: 'Boss A', escorts: ['harrier', 'harrier'] }),
    bossDefinition('bossB', 'Placeholder Boss B', 'nebula', { bossName: 'Boss B', escorts: ['fighter', 'harrier'] }),
    bossDefinition('bossC', 'Placeholder Boss C', 'deepSpace', { bossName: 'Boss C', escorts: ['bulwark', 'fighter'] }),
];

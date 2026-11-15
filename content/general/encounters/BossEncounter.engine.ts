import { hostileToPlayer } from 'engine/campaign/factions';
import { hostileFaction } from 'engine/encounters/CombatEncounter';
import { Encounter } from 'engine/encounters/Encounter';
import type { EnvironmentType } from 'common-data/features/sectors/types/EnvironmentType';
import type { EncounterId, SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { ShipDesign } from 'engine/campaign/shipDesigns';
import type { EncounterDefinition } from 'engine/encounters/EncounterDefinition';
import type { GameObject } from 'engine/state/GameObject';
import type { GameState } from 'engine/state/GameState';

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

/** A placeholder boss: a flagship plus escorts. */
export function bossDefinition(id: EncounterId, name: string, defaultEnvironment: EnvironmentType, config: BossConfig): EncounterDefinition {
    return { id, name, kind: 'boss', objective: { type: 'boss' }, defaultEnvironment, create: (state, node) => new BossEncounter(state, node, config) };
}

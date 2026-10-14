import { Objective } from './Objective';
import type { GameObject } from 'src/state/GameObject';

/** The scenario id the boss ship is spawned with, which this objective watches. */
export const bossScenarioId = 'boss';

export class BossObjective extends Objective {
    private boss: GameObject | undefined;
    private bossDestroyed = false;

    override get isMet(): boolean {
        return this.bossDestroyed;
    }

    override start(): void {
        this.boss = this.state.getObjectByScenarioId(bossScenarioId);
        if (!this.boss) {
            throw new Error('Boss objective requires the encounter to spawn a ship with the boss scenario id');
        }
    }

    override onObjectRemoved(object: GameObject): void {
        if (object === this.boss) {
            this.bossDestroyed = true;
        }
    }
}

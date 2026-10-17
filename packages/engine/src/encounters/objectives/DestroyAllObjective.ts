import { getHostileShips } from 'src/utils/shipQueries';
import { Objective } from './Objective';
import type { GameObject } from 'src/state/GameObject';

export class DestroyAllObjective extends Objective {
    private started = false;

    override start(): void {
        this.started = true;
        this.updateIsMet();
    }

    override onObjectRemoved(_object: GameObject): void {
        this.updateIsMet();
    }

    private updateIsMet(): void {
        this.isMet = this.started && getHostileShips(this.state).length === 0;
    }
}

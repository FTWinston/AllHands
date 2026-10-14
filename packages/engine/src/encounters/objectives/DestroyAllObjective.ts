import { getHostileShips } from '../hostiles';
import { Objective } from './Objective';

export class DestroyAllObjective extends Objective {
    private started = false;

    override get isMet(): boolean {
        return this.started && getHostileShips(this.state).length === 0;
    }

    override start(): void {
        this.started = true;
    }
}

import { Objective } from './Objective';
import type { GameState } from 'src/state/GameState';

export class SurviveObjective extends Objective {
    private _endTime = 0;
    private started = false;

    constructor(state: GameState, private readonly durationMs: number) {
        super(state);
    }

    override get isMet(): boolean {
        return this.started && this.state.currentTime >= this._endTime;
    }

    override get endTime(): number {
        return this._endTime;
    }

    override start(): void {
        this._endTime = this.state.currentTime + this.durationMs;
        this.started = true;
    }
}

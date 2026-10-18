import { CandidateAction, Blackboard } from '../types';
import { Officer } from './Officer';

export class HelmOfficer extends Officer {
    readonly role = 'helm' as const;

    /** A maneuver to play once the one being cancelled has stopped, as a human helm would: cancel, then play. */
    private pendingPlay: Extract<CandidateAction, { kind: 'playCard' }> | null = null;

    override update(_currentTime: number): void {
        if (!this.pendingPlay || this.ship.helmState.activeManeuver) {
            return;
        }

        const play = this.pendingPlay;
        this.pendingPlay = null;

        // The card can have left the hand (e.g. damage) while the cancel was in progress.
        if (this.getSystem().hand.some(card => card.id === play.cardId)) {
            super.execute(play);
        }
    }

    override think(blackboard: Blackboard, currentTime: number): void {
        // Don't reconsider while a replacement maneuver is waiting for the cancelled one to stop.
        if (!this.pendingPlay) {
            super.think(blackboard, currentTime);
        }
    }

    protected override execute(action: CandidateAction): void {
        if (action.kind === 'playCard' && this.ship.helmState.activeManeuver) {
            // Playing over a running maneuver would orphan its card, so cancel it first.
            this.ship.helmState.cancelActiveManeuver();
            this.pendingPlay = action;
            return;
        }

        super.execute(action);
    }
}

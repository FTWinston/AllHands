import { currentEvasion, generateCandidateLocations, positionValue } from '../evaluators/helm';
import { projectCurrentEndpoint } from '../evaluators/helpers';
import { CandidatePlay, EvaluationContext } from '../types';
import { Officer } from './Officer';

export class HelmOfficer extends Officer {
    readonly role = 'helm' as const;

    protected override standingCandidates(ctx: EvaluationContext): CandidatePlay[] {
        const helm = this.ship.helmState;
        if (!helm.activeManeuver) {
            return [];
        }

        // Cancel scores by how much better the best reachable place is than where the current motion ends.
        // The switching cost (interrupts) absorbs noise so we don't thrash between similar options.
        const currentValue = positionValue(projectCurrentEndpoint(this.ship), currentEvasion(ctx), ctx);
        const own = this.ship.getPosition(ctx.currentTime);
        let bestAlternative = 0;
        for (const location of generateCandidateLocations(ctx)) {
            // Facing approximated by the current angle; undervaluing alternatives only makes cancelling rarer.
            bestAlternative = Math.max(bestAlternative, positionValue({ ...location, angle: own.angle }, 0, ctx));
        }

        return [{
            score: bestAlternative - currentValue,
            cost: 0,
            interrupts: true,
            action: { kind: 'cancelManeuver' },
        }];
    }
}

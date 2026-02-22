import { type } from '@colyseus/schema';
import { HelmSystemInfo, CrewSystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CardCooldownState } from './CardCooldownState';
import { CrewSystemState } from './CrewSystemState';
import { GameState } from './GameState';
import { MotionKeyframe } from './MotionKeyframe';
import type { Ship } from './Ship';

export class HelmState extends CrewSystemState implements HelmSystemInfo {
    constructor(setup: CrewSystemSetupInfo, gameState: GameState, ship: Ship, getCardId: () => number) {
        super(setup, gameState, ship, getCardId);
    }

    @type(CardCooldownState) activeManeuver: CardCooldownState | null = null;

    private cancellingManeuver = false;

    update(currentTime: number) {
        if (this.activeManeuver) {
            if (currentTime >= this.activeManeuver.endTime) {
                this.activeManeuver = null;
                this.cancellingManeuver = false;
            } else if (this.cancellingManeuver || this.powerLevel < this.activeManeuver.power) {
                // End the current maneuver early by slowing to a stop, reaching where we would be in 0.25s over 0.75s instead.
                const endPosition = this.getShip().getPosition(currentTime + 0.25);

                this.getShip().setMotion(new MotionKeyframe(
                    currentTime + 0.75,
                    endPosition.x,
                    endPosition.y,
                    endPosition.angle
                ));

                this.activeManeuver = null;
                this.cancellingManeuver = false;
            }
        } else if (this.cancellingManeuver) {
            this.cancellingManeuver = false;
        }
    }

    cancelActiveManeuver() {
        this.cancellingManeuver = true;
    }
}

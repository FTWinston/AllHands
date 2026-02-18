import { ArraySchema, type } from '@colyseus/schema';
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

    // I'd have liked this to be a nullable CardCooldownState object,
    // but it's not synchronizing to the client if reassigned.
    // So instead, it's an array that has either zero or one CardCooldownState in it.
    // This works, as long as you don't overwrite the item in the array.
    // Instead, clear the array then push a new item if needed.
    @type([CardCooldownState]) activeManeuver = new ArraySchema<CardCooldownState>();

    private cancellingManeuver = false;

    update(currentTime: number) {
        if (this.activeManeuver.length) {
            const activeManeuver = this.activeManeuver[0];

            if (currentTime >= activeManeuver.endTime) {
                this.activeManeuver.clear();
                this.cancellingManeuver = false;
            } else if (this.cancellingManeuver || this.powerLevel < activeManeuver.power) {
                // End the current maneuver early by slowing to a stop, reaching where we would be in 0.25s over 0.75s instead.
                const endPosition = this.getShip().getPosition(currentTime + 0.25);

                this.getShip().setMotion(new MotionKeyframe(
                    currentTime + 0.75,
                    endPosition.x,
                    endPosition.y,
                    endPosition.angle
                ));

                this.activeManeuver.clear();
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

import { ArraySchema, type } from '@colyseus/schema';
import { HelmSystemInfo, SystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CardCooldownState } from './CardCooldownState';
import { GameState } from './GameState';
import { MotionKeyframe } from './MotionKeyframe';
import { Ship } from './Ship';
import { SystemState } from './SystemState';

export class HelmState extends SystemState implements HelmSystemInfo {
    constructor(setup: SystemSetupInfo, gameState: GameState, ship: Ship, getCardId: () => number) {
        super(setup, gameState, ship, getCardId);
    }

    // I'd have liked this to be a nullable CardCooldownState object,
    // but it's not synchronizing to the client if reassigned.
    // So instead, it's an array that has either zero or one CardCooldownState in it.
    // This works, as long as you don't overwrite the item in the array.
    // Instead, clear the array then push a new item if needed.
    @type([CardCooldownState]) activeManeuver = new ArraySchema<CardCooldownState>();

    update(currentTime: number) {
        super.update(currentTime);

        if (this.activeManeuver.length) {
            const activeManeuver = this.activeManeuver[0];

            if (currentTime >= activeManeuver.endTime) {
                this.activeManeuver.clear();
            } else if (this.powerLevel < activeManeuver.power) {
                // End the current maneuver early by slowing to a stop, reaching where we would be in 0.25s over 0.5s instead.
                const endPosition = this.ship.getPosition(currentTime + 0.25);

                this.ship.setMotion(new MotionKeyframe(
                    endPosition.x,
                    endPosition.y,
                    endPosition.angle,
                    currentTime + 0.5
                ));

                this.activeManeuver.clear();
            }
        }
    }
}

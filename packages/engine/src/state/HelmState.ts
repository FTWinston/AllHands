import { type } from '@colyseus/schema';
import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { HelmSystemInfo, CrewSystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { parseVector } from 'common-data/features/space/utils/vectors';
import { EngineLocationTargetCardDefinition } from 'src/cards/EngineCardDefinition';
import { CardCooldownState } from './CardCooldownState';
import { CardState } from './CardState';
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

    override playLocationCard(cardInstance: CardState, cardDefinition: EngineLocationTargetCardDefinition, targetId: string, parameters: CardParameters): boolean {
        const targetVector = parseVector(targetId);
        if (targetVector === null) {
            console.log('invalid location target', targetId);
            return false;
        }

        if (!cardDefinition.play(this.getGameState(), this.getShip(), cardInstance, cardDefinition, targetVector, parameters)) {
            console.log('card refused to play');
            return false;
        }

        return true;
    }

    cancelActiveManeuver() {
        this.cancellingManeuver = true;
    }
}

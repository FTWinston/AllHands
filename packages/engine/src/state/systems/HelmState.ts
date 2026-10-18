import { type } from '@colyseus/schema';
import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { HelmSystemInfo, SystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { parseVector } from 'common-data/features/space/utils/vectors';
import { EngineLocationTargetCardDefinition } from 'src/cards/EngineCardDefinition';
import { CardCooldownState } from '../CardCooldownState';
import { CardState } from '../CardState';
import { GameState } from '../GameState';
import { MotionKeyframe } from '../MotionKeyframe';
import { CrewSystemState } from './CrewSystemState';
import type { Ship } from '../Ship';

export class HelmState extends CrewSystemState implements HelmSystemInfo {
    constructor(setup: SystemSetupInfo, gameState: GameState, ship: Ship, scannedSystemIndex: number, initialPowerLevel: number, getCardId: () => number) {
        super(setup, 'helm', gameState, ship, scannedSystemIndex, initialPowerLevel, getCardId);
    }

    @type(CardCooldownState) activeManeuver: CardCooldownState | null = null;

    private cancellingManeuver = false;

    update(currentTime: number) {
        if (this.activeManeuver) {
            if (currentTime >= this.activeManeuver.endTime) {
                this.discardActiveManeuver();
            } else if (this.cancellingManeuver || this.powerLevel < this.activeManeuver.power) {
                // End the current maneuver early by slowing to a stop, reaching where we would be in 0.25s over 0.75s instead.
                // Keyframe times are in milliseconds. Start from a "now" keyframe, so the slowdown begins from where the ship currently is.
                const ship = this.getShip();
                const currentPosition = ship.getPosition(currentTime);
                const endPosition = ship.getPosition(currentTime + 250);

                ship.setMotion(
                    new MotionKeyframe(currentTime, currentPosition.x, currentPosition.y, currentPosition.angle),
                    new MotionKeyframe(currentTime + 750, endPosition.x, endPosition.y, endPosition.angle)
                );

                this.discardActiveManeuver();
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

    setActiveManeuver(maneuver: CardCooldownState) {
        this.activeManeuver = maneuver;
        this.markCardSlotted(maneuver.card);
        this.scienceScanDataChanged.invoke();
    }

    cancelActiveManeuver() {
        this.cancellingManeuver = true;
    }

    private discardActiveManeuver() {
        if (this.activeManeuver) {
            this.markCardUnslotted(this.activeManeuver.card);
            this.handlePlayedCard(this.activeManeuver.card, -1, false);

            this.activeManeuver = null;
            this.scienceScanDataChanged.invoke();
        }

        this.cancellingManeuver = false;
    }

    cleanupAfterEncounter() {
        this.activeManeuver = null;
        this.cancellingManeuver = false;
        super.cleanupAfterEncounter();
    }
}

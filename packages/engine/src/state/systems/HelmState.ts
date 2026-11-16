import { type } from '@colyseus/schema';
import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { HelmSystemInfo, SystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { Position } from 'common-data/features/space/types/Position';
import { parseVector } from 'common-data/features/space/utils/vectors';
import { EngineLocationTargetCardDefinition } from 'src/cards/EngineCardDefinition';
import { ListenableEvent } from 'src/classes/ListenableEvent';
import { CardCooldownState } from '../CardCooldownState';
import { CardState } from '../CardState';
import { GameState } from '../GameState';
import { MotionKeyframe } from '../MotionKeyframe';
import { CrewSystemState } from './CrewSystemState';
import type { Ship } from '../Ship';

/**
 * How long Momentum lasts without flying, in milliseconds: a maneuver started within this long of the last one finishing adds a level,
 * and a ship that has been still for longer than this loses every level.
 */
export const momentumWindow = 2000;

/** A maneuver shorter than this doesn't count as one to follow on from, so that tiny hops can't build Momentum. */
export const momentumMinManeuverDuration = 1000;

export class HelmState extends CrewSystemState implements HelmSystemInfo {
    constructor(setup: SystemSetupInfo, gameState: GameState, ship: Ship, scannedSystemIndex: number, initialPowerLevel: number, getCardId: () => number) {
        super(setup, 'helm', gameState, ship, scannedSystemIndex, initialPowerLevel, getCardId);

        // Every hit on the ship knocks a level of Momentum off, whether or not the shields stopped it.
        ship.hitReceived.addListener('momentum', () => {
            this.adjustEffectLevel('momentum', -1);
        });
    }

    @type(CardCooldownState) activeManeuver: CardCooldownState | null = null;

    /** Whether this ship is held in another's tractor beam, for helm's client to show: the held effect sets it, as that's on the engineer's tile, which helm's client can't see. */
    @type('boolean') isHeld = false;

    /** Triggered whenever a card becomes this ship's active maneuver, as it starts. */
    readonly maneuverStarted = new ListenableEvent();

    private cancellingManeuver = false;

    /** Called once when the maneuver being flown ends, however it ends (see `whenActiveManeuverEnds`). */
    private activeManeuverEnded: (() => void) | null = null;

    /** Called on every update while the maneuver being flown carries on, to steer it as it goes (see `whileActiveManeuverFlies`). */
    private activeManeuverSteering: ((currentTime: number) => void) | null = null;

    /** When the last maneuver to be flown to its end finished, or null if the last one was cut short (or was too short to count). */
    private lastManeuverEndTime: number | null = null;

    /** Where the ship was at the last update, and when it last moved or turned, to tell how long it has been still. */
    private lastPosition: Position | null = null;
    private lastMovedTime = 0;

    /** Percentage points added to the chance to hit of this ship's own weapons, by the way it's being flown (see `TacticalState.determineAccuracy`). */
    weaponAccuracyModifier = 0;

    /** Percentage points added to this ship's evasion, on top of that of the maneuver it's flying. */
    evasionModifier = 0;

    /** Percentage added to the speed of every maneuver this ship starts (see `applyMotionCard`). */
    maneuverSpeedModifier = 0;

    /** How much harder this ship is to hit just now, in percentage points: the evasion of the maneuver it's flying, plus anything else that's adding to it. */
    get evasion(): number {
        return Math.max(0, (this.activeManeuver?.card?.getParameter('evasion') ?? 0) + this.evasionModifier);
    }

    /** What to multiply the speed of a maneuver that's starting by. */
    get maneuverSpeedMultiplier(): number {
        return Math.max(0.1, 1 + this.maneuverSpeedModifier / 100);
    }

    update(currentTime: number) {
        this.updateManeuver(currentTime);
        this.loseMomentumIfStill(currentTime);
    }

    private updateManeuver(currentTime: number) {
        if (this.activeManeuver) {
            if (currentTime >= this.activeManeuver.endTime) {
                const duration = this.activeManeuver.endTime - this.activeManeuver.startTime;
                this.discardActiveManeuver();

                if (duration >= momentumMinManeuverDuration) {
                    this.lastManeuverEndTime = currentTime;
                }
            } else if (this.cancellingManeuver || this.powerLevel < this.activeManeuver.power || this.health <= 0) {
                // A ship can't finish a maneuver that it has called off, or no longer has the power for, or the helm to fly: one with every card damaged is out.
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
            } else {
                this.activeManeuverSteering?.(currentTime);
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

    /** A ship that hasn't moved or turned for longer than the Momentum window loses all of its Momentum. */
    private loseMomentumIfStill(currentTime: number) {
        const position = this.getShip().getPosition(currentTime);
        const last = this.lastPosition;
        this.lastPosition = position;

        if (!last || Math.abs(position.x - last.x) > 1e-6 || Math.abs(position.y - last.y) > 1e-6 || Math.abs(position.angle - last.angle) > 1e-6) {
            this.lastMovedTime = currentTime;
        } else if (currentTime - this.lastMovedTime > momentumWindow) {
            this.removeEffect('momentum', 'expired');
        }
    }

    /**
     * Have the given card be the maneuver this ship is flying, until the time it ends. Any maneuver it was already flying ends here.
     * Starting one soon enough after the last one finished adds a level of Momentum.
     */
    setActiveManeuver(maneuver: CardCooldownState) {
        const currentTime = this.getGameState().currentTime;
        const followsOn = this.activeManeuver === null
            && this.lastManeuverEndTime !== null
            && currentTime - this.lastManeuverEndTime <= momentumWindow;

        if (this.activeManeuver) {
            this.discardActiveManeuver();
        }

        this.activeManeuver = maneuver;
        this.markCardSlotted(maneuver.card);

        // The ship is under way from now, even if it hasn't had time to get anywhere yet.
        this.lastMovedTime = currentTime;
        this.lastManeuverEndTime = null;

        if (followsOn) {
            this.adjustEffectLevel('momentum', 1);
        }

        this.maneuverStarted.triggerListeners();
        this.scienceScanDataChanged.invoke();
    }

    /** Have something done when the maneuver now being flown ends, whether it's flown to its end or cut short. */
    whenActiveManeuverEnds(callback: () => void) {
        if (this.activeManeuver) {
            this.activeManeuverEnded = callback;
        }
    }

    /** Have something done on every update while the maneuver now being flown carries on, e.g. to change its course. It stops when that maneuver ends. */
    whileActiveManeuverFlies(callback: (currentTime: number) => void) {
        if (this.activeManeuver) {
            this.activeManeuverSteering = callback;
        }
    }

    /** A card that has just become the active maneuver stays out of the deck until that ends, however it was played. */
    protected override handlePlayedCard(card: CardState, cardIndex: number, playedIntoSlot: boolean): void {
        super.handlePlayedCard(card, cardIndex, playedIntoSlot || this.activeManeuver?.card === card);
    }

    cancelActiveManeuver() {
        this.cancellingManeuver = true;
    }

    private discardActiveManeuver() {
        const maneuver = this.activeManeuver;
        if (maneuver) {
            // Cleared first, so that its card is treated as one that has been played, not one that's being flown.
            this.activeManeuver = null;
            this.activeManeuverSteering = null;
            this.lastManeuverEndTime = null;
            this.markCardUnslotted(maneuver.card);
            this.handlePlayedCard(maneuver.card, -1, false);

            this.finishManeuverEnded();
            this.scienceScanDataChanged.invoke();
        }

        this.cancellingManeuver = false;
    }

    private finishManeuverEnded() {
        const ended = this.activeManeuverEnded;
        this.activeManeuverEnded = null;
        ended?.();
    }

    cleanupAfterEncounter() {
        this.activeManeuver = null;
        this.activeManeuverSteering = null;
        this.cancellingManeuver = false;
        this.finishManeuverEnded();
        this.lastManeuverEndTime = null;
        this.lastPosition = null;
        super.cleanupAfterEncounter();
    }
}

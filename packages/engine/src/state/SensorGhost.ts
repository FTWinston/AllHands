import { entity, type, view } from '@colyseus/schema';
import { knowsGhostClientRole } from 'common-data/features/ships/types/CrewRole';
import { MobileObject } from './MobileObject';
import { MotionKeyframe } from './MotionKeyframe';
import type { GameObject } from './GameObject';
import type { GameState } from './GameState';
import type { Ship } from './Ship';

/** How far ahead, in milliseconds, a ship's motion is looked at to tell which way it's going, and how fast: far enough to average out the way a manoeuvre eases in. */
const velocityLookAhead = 1000;

/**
 * A false contact that a ship leaves behind (see the Sensor Ghost card): an object in space that looks exactly like that ship,
 * with its appearance, name and faction, flying on the way the ship was going when it was left, for a while.
 *
 * To those it fools (ships hostile to it) it's indistinguishable from a ship, so it turns up in their lists of targets, and in the AI's.
 * To everyone else it's sent with `isSensorGhost` set, so that it can be drawn as a ghost, and isn't offered as a target.
 * It's the opposite of a field (see `FieldState`), which is kept out of `GameState.objects` so that it's never taken for a ship:
 * a ghost is in there so that it's taken for one, but it's not a `Ship`, so everything that really is about ships passes it by.
 *
 * Anything that's played on it, or fired at it, is spent, and it vanishes (see `expose`). It also vanishes once its time is up,
 * and if the ship that left it is gone, and it's never counted as an object leaving the game (see `GameState.remove`).
 */
@entity
export class SensorGhost extends MobileObject {
    /** `duration` is how long it lasts, in milliseconds. */
    constructor(gameState: GameState, owner: Ship, duration: number) {
        const now = gameState.currentTime;
        const start = owner.getPosition(now);
        const ahead = owner.getPosition(now + velocityLookAhead);

        // It carries on at the speed (and in the direction) that the ship is moving in at this moment, and keeps the ship's facing. A ship that's still leaves a ghost that's still.
        const velocityX = (ahead.x - start.x) / velocityLookAhead;
        const velocityY = (ahead.y - start.y) / velocityLookAhead;

        super(
            gameState,
            { name: owner.name, appearance: owner.appearance, faction: owner.faction ?? undefined },
            new MotionKeyframe(now, start.x, start.y, start.angle),
            new MotionKeyframe(now + duration, start.x + velocityX * duration, start.y + velocityY * duration, start.angle)
        );

        this.ownerId = owner.id;
        this.endTime = now + duration;
    }

    /**
     * Whether this is a ghost: sent only to those who aren't fooled by it, as it's all that tells them apart.
     * Anyone else has no such field for it, so can't tell it from the ship it copies.
     */
    @view(knowsGhostClientRole) @type('boolean') readonly isSensorGhost = true;

    /** The id of the ship that left it. */
    private readonly ownerId: string;

    /** When it vanishes of its own accord. */
    private readonly endTime: number;

    /** Whether the given object takes this for a ship: it does if it's hostile to the faction the ghost is made to look like. Everyone else knows it for a ghost. */
    isTakenForShipBy(viewer: GameObject): boolean {
        return this.gameState.factionRegistry.areHostile(this, viewer);
    }

    public override tick(deltaTime: number, currentTime: number) {
        super.tick(deltaTime, currentTime);

        if (currentTime >= this.endTime || this.gameState.objects.get(this.ownerId) === undefined) {
            this.expose();
        }
    }

    /** Make it vanish, as something has found nothing there. Does nothing if it's gone already. */
    expose() {
        if (this.gameState.objects.get(this.id) === this) {
            this.destroy();
        }
    }
}

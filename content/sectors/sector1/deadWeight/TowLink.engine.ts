import { MotionKeyframe } from 'engine/state/MotionKeyframe';
import type { MobileObject } from 'engine/state/MobileObject';

/**
 * A line from one object to another, which keeps the one being towed a fixed distance astern of the one towing it.
 * Each time the tower's course changes, the towed object is given the same course, with each point of it moved back along the tower's heading at that point.
 * It has no engines of its own to fight with, so whatever moves the tower moves it, and stopping the tower stops it.
 */
export class TowLink {
    private attached = true;
    /** The last point of the tower's course, as of when the towed object's course was last worked out from it. */
    private towerCourseEnd: MotionKeyframe | undefined;

    constructor(private readonly tower: MobileObject, private readonly towed: MobileObject, private readonly length: number) {
        this.update();
    }

    /** Whether the line is still attached at both ends. */
    get isAttached(): boolean {
        return this.attached;
    }

    /** Keeps the towed object's course in step with the tower's. Call it whenever the tower's course might have changed: once a tick will do. */
    update(): void {
        const motion = this.tower.motion;
        const end = motion[motion.length - 1];
        // A new course always ends with a new point, and dropping points that are long past doesn't change the course.
        if (!this.attached || end === this.towerCourseEnd) {
            return;
        }

        this.towerCourseEnd = end;
        this.towed.motion.splice(0, this.towed.motion.length);
        this.towed.motion.push(...[...motion].map(point => this.astern(point)));
    }

    /** Cuts the line. The towed object stops where it is, facing the way it was. */
    release(currentTime: number): void {
        if (!this.attached) {
            return;
        }

        this.attached = false;
        const position = this.towed.getPosition(currentTime);
        this.towed.setMotion(new MotionKeyframe(currentTime, position.x, position.y, position.angle));
    }

    /** The point the line's length behind this one, facing the same way. */
    private astern({ time, x, y, angle }: MotionKeyframe): MotionKeyframe {
        // Angles are counter-clockwise with y pointing down, so a heading's direction is (cos, -sin).
        return new MotionKeyframe(time, x - Math.cos(angle) * this.length, y + Math.sin(angle) * this.length, angle);
    }
}

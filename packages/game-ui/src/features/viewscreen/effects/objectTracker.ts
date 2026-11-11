import { GameObjectInfo, RelationshipViewer } from 'common-data/features/space/types/GameObjectInfo';
import { ObjectAppearance, shipAppearances } from 'common-data/features/space/types/ObjectAppearance';
import { Position } from 'common-data/features/space/types/Position';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { getDisplayRelationship } from 'common-data/features/space/utils/getDisplayRelationship';
import { interpolatePosition } from 'common-data/features/space/utils/interpolate';
import { getSvgBitmap } from 'common-ui/features/spacemap/utils/svgBitmapCache';

/** The colors of a ship's drawing, when it's lit up by a blast. */
export const litShipColor = '#ffd9b0';

/** The colors of a ship's drawing, once it's a wreck. */
export const wreckColors = ['#3a1a14', '#6b3320'] as const;

/** The color of a ship's drawing as it jumps to warp, and of the light it leaves behind. */
export const warpColor = '#cfe3ff';

/** What's known about an object, including for a little while after it's gone. */
export type TrackedObject = Position & {
    name: string;
    appearance: ObjectAppearance;
    relationship: RelationshipType;
    /** Whether this has an engine. */
    isShip: boolean;
    /** In world units per second. */
    speed: number;
    /** False once the object has gone. */
    isPresent: boolean;
    lastSeenTime: number;
};

/**
 * Remembers where objects are, by ID. Effects can outlast the objects involved, as a shot's source or target can be
 * destroyed at any moment, and they want to carry on from where those objects were.
 */
export type ObjectTracker = Map<string, TrackedObject>;

/** How long to remember an object after it's gone, in milliseconds. This should be at least as long as any effect lasts. */
const forgetAfter = 10000;

/** Update the tracker with where every object is now. Call this once per frame. */
export function trackObjects(tracker: ObjectTracker, objects: Record<string, GameObjectInfo>, viewer: RelationshipViewer, time: number) {
    for (const [id, tracked] of tracker) {
        tracked.isPresent = false;

        if (time - tracked.lastSeenTime > forgetAfter) {
            tracker.delete(id);
        }
    }

    for (const object of Object.values(objects)) {
        const position = interpolatePosition(object.motion, time);
        const next = interpolatePosition(object.motion, time + 50);

        if (!tracker.has(object.id)) {
            // These bitmaps load asynchronously, so get them ready before they're needed.
            getSvgBitmap(object.appearance, litShipColor, litShipColor);
            getSvgBitmap(object.appearance, wreckColors[0], wreckColors[1]);
            getSvgBitmap(object.appearance, warpColor, warpColor);
        }

        tracker.set(object.id, {
            x: position.x,
            y: position.y,
            angle: position.angle,
            name: object.name,
            appearance: object.appearance,
            relationship: getDisplayRelationship(object, viewer),
            isShip: object.appearance === 'chevron' || (shipAppearances as readonly ObjectAppearance[]).includes(object.appearance),
            speed: Math.hypot(next.x - position.x, next.y - position.y) * 20,
            isPresent: true,
            lastSeenTime: time,
        });
    }
}

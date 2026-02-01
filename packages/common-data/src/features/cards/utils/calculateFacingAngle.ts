import { Vector2D } from '../../space/types/Vector2D';
import { determineAngle } from '../../space/utils/vectors';
import { CardMotionSegmentFacing } from '../types/CardDefinition';

/**
 * Calculate an angle based on a CardMotionSegmentFacing value.
 */
export function calculateFacingAngle(
    facing: CardMotionSegmentFacing | undefined,
    currentAngle: number,
    prevKeyframe: Vector2D,
    location: Vector2D
): number {
    if (facing === CardMotionSegmentFacing.NextVector || facing === CardMotionSegmentFacing.FinalVector) {
        return determineAngle(prevKeyframe, location);
    } else if (facing === CardMotionSegmentFacing.PreviousVector) {
        return determineAngle(location, prevKeyframe);
    } else {
        // CardMotionSegmentFacing.Current or undefined - keep current angle
        return currentAngle;
    }
}

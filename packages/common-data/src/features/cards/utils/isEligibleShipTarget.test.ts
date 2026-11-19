import { RelationshipType } from 'src/features/space/types/RelationshipType';
import { describe, expect, it } from 'vitest';
import { isEligibleShipTarget } from './isEligibleShipTarget';

const others = [RelationshipType.None, RelationshipType.Hostile, RelationshipType.Neutral, RelationshipType.Friendly, RelationshipType.Unknown];

describe('isEligibleShipTarget', () => {
    it('never takes the playing ship itself', () => {
        for (const wanted of ['hostile', 'friendly', 'any', undefined] as const) {
            expect(isEligibleShipTarget(RelationshipType.Self, wanted)).toBe(false);
        }
    });

    it('takes any other ship by default', () => {
        for (const relationship of others) {
            expect(isEligibleShipTarget(relationship)).toBe(true);
            expect(isEligibleShipTarget(relationship, 'any')).toBe(true);
        }
    });

    it('takes only ships with exactly the relationship wanted', () => {
        expect(others.filter(relationship => isEligibleShipTarget(relationship, 'hostile'))).toEqual([RelationshipType.Hostile]);
        expect(others.filter(relationship => isEligibleShipTarget(relationship, 'friendly'))).toEqual([RelationshipType.Friendly]);
    });
});

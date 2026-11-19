import { GameObjectInfo, RelationshipViewer } from 'common-data/features/space/types/GameObjectInfo';
import { shipAppearances } from 'common-data/features/space/types/ObjectAppearance';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { describe, expect, it } from 'vitest';
import { findNearestEligibleShip } from './findNearestEligibleShip';

function object(id: string, x: number, y: number, faction: string | null, appearance: GameObjectInfo['appearance'] = shipAppearances[0]): GameObjectInfo {
    return { id, name: id, appearance, faction, motion: [{ time: 0, x, y, angle: 0 }] };
}

const viewer: RelationshipViewer = {
    shipId: 'self',
    faction: 'player',
    relations: { raiders: RelationshipType.Hostile, traders: RelationshipType.Neutral },
};

const objects: Record<string, GameObjectInfo> = {
    self: object('self', 0, 0, 'player', 'chevron'),
    ally: object('ally', 10, 0, 'player', 'chevron'),
    raider: object('raider', 0, 10, 'raiders'),
    trader: object('trader', -10, 0, 'traders'),
    asteroid: object('asteroid', 1, 1, null, 'circle'),
};

describe('findNearestEligibleShip', () => {
    it('picks the ship of any relationship closest to the location, but never the viewer\'s own ship or anything that isn\'t a ship', () => {
        expect(findNearestEligibleShip(objects, viewer, { x: 2, y: 1 }, undefined, 0)?.ship.id).toBe('ally');
        expect(findNearestEligibleShip(objects, viewer, { x: -6, y: 0 }, 'any', 0)?.ship.id).toBe('trader');
        expect(findNearestEligibleShip(objects, viewer, { x: 0, y: 7 }, 'any', 0)?.ship.id).toBe('raider');
    });

    it('only picks ships with the relationship the card wants', () => {
        expect(findNearestEligibleShip(objects, viewer, { x: 9, y: 0 }, 'hostile', 0)?.ship.id).toBe('raider');
        expect(findNearestEligibleShip(objects, viewer, { x: -9, y: 0 }, 'friendly', 0)?.ship.id).toBe('ally');
    });

    it('gives where the ship is at the given time', () => {
        const moving = { ...object('mover', 0, 0, 'raiders'), motion: [{ time: 0, x: 0, y: 0, angle: 0 }, { time: 1000, x: 10, y: 0, angle: 0 }] };
        const result = findNearestEligibleShip({ self: objects.self, moving }, viewer, { x: 0, y: 0 }, 'hostile', 500);
        expect(result?.ship.id).toBe('mover');
        expect(result?.position.x).toBeCloseTo(5, 0);
    });

    it('finds nothing when no ship is eligible', () => {
        expect(findNearestEligibleShip({ self: objects.self, trader: objects.trader }, viewer, { x: 0, y: 0 }, 'hostile', 0)).toBeNull();
    });
});

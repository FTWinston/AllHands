import { WeaponEffect } from 'common-data/features/space/types/WeaponEffect';
import { describe, expect, it } from 'vitest';
import { getWarpedOutIds, warpOutHideDuration } from './drawWarpOut';

const warpOut = (sourceId: string, startTime: number): WeaponEffect => ({
    type: 'warpOut',
    sourceId,
    appearance: 'dart-fighter',
    position: { x: 0, y: 0, angle: 0 },
    startTime,
});

describe('getWarpedOutIds', () => {
    it('is empty with nothing going on', () => {
        expect(getWarpedOutIds([], 0).size).toBe(0);
    });

    it('hides a ship from the moment it starts its jump', () => {
        const effects = [warpOut('a', 1000)];

        expect([...getWarpedOutIds(effects, 999)]).toEqual([]);
        expect([...getWarpedOutIds(effects, 1000)]).toEqual(['a']);
    });

    it('lets a ship that is still there be seen again after a while, so it is back for the next encounter', () => {
        const effects = [warpOut('a', 1000)];

        expect([...getWarpedOutIds(effects, 1000 + warpOutHideDuration)]).toEqual(['a']);
        expect([...getWarpedOutIds(effects, 1001 + warpOutHideDuration)]).toEqual([]);
    });

    it('only hides ships that have jumped to warp', () => {
        const effects: WeaponEffect[] = [
            warpOut('a', 0),
            { type: 'explosion', sourceId: 'b', appearance: 'dart-fighter', position: { x: 0, y: 0, angle: 0 }, startTime: 0 },
            { type: 'impact', sourceId: 'c', targetId: 'd', damage: 1, startTime: 0 },
        ];

        expect([...getWarpedOutIds(effects, 10)]).toEqual(['a']);
    });
});

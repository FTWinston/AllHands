import { WeaponEffect } from 'common-data/features/space/types/WeaponEffect';
import { describe, expect, it } from 'vitest';
import { getWarpedAwayIds, warpAwayHideDuration } from './drawWarpAway';

const warpAway = (sourceId: string, startTime: number): WeaponEffect => ({
    type: 'warpAway',
    sourceId,
    appearance: 'dart-fighter',
    position: { x: 0, y: 0, angle: 0 },
    startTime,
});

describe('getWarpedAwayIds', () => {
    it('is empty with nothing going on', () => {
        expect(getWarpedAwayIds([], 0).size).toBe(0);
    });

    it('hides a ship from the moment it starts its jump', () => {
        const effects = [warpAway('a', 1000)];

        expect([...getWarpedAwayIds(effects, 999)]).toEqual([]);
        expect([...getWarpedAwayIds(effects, 1000)]).toEqual(['a']);
    });

    it('lets a ship that is still there be seen again after a while, so it is back for the next encounter', () => {
        const effects = [warpAway('a', 1000)];

        expect([...getWarpedAwayIds(effects, 1000 + warpAwayHideDuration)]).toEqual(['a']);
        expect([...getWarpedAwayIds(effects, 1001 + warpAwayHideDuration)]).toEqual([]);
    });

    it('only hides ships that have jumped to warp', () => {
        const effects: WeaponEffect[] = [
            warpAway('a', 0),
            { type: 'explosion', sourceId: 'b', appearance: 'dart-fighter', position: { x: 0, y: 0, angle: 0 }, startTime: 0 },
            { type: 'impact', sourceId: 'c', targetId: 'd', damage: 1, startTime: 0 },
        ];

        expect([...getWarpedAwayIds(effects, 10)]).toEqual(['a']);
    });
});

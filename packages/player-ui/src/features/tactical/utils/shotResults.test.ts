import { WeaponEffect } from 'common-data/features/space/types/WeaponEffect';
import { describe, expect, it } from 'vitest';
import { addShotResult, describeShotResult, getShotOutcome, maxShotResults, ShotResult, shotResultLifetime } from './shotResults';

const shot = (extra: object = {}) => ({ type: 'shot', weapon: 'phaserCannon', sourceId: 'me', targetId: 'foe', startTime: 0, ...extra }) as WeaponEffect;
const impact = (extra: object = {}) => ({ type: 'impact', sourceId: 'me', targetId: 'foe', damage: 4, system: 'helm', startTime: 0, ...extra }) as WeaponEffect;

describe('getShotOutcome', () => {
    it('reports a missed shot as a miss', () => {
        expect(getShotOutcome(shot({ missed: true }), 'me')).toEqual({ outcome: 'miss', targetId: 'foe' });
    });

    it('waits for the impact of a shot that will hit', () => {
        expect(getShotOutcome(shot(), 'me')).toBeNull();
    });

    it('reports an impact as a hit on the system it landed on', () => {
        expect(getShotOutcome(impact(), 'me')).toEqual({ outcome: 'hit', targetId: 'foe', system: 'helm' });
    });

    it('marks a shot taken by an interposing ship as intercepted', () => {
        expect(getShotOutcome(shot({ missed: true, intercepted: true }), 'me')).toEqual({ outcome: 'miss', targetId: 'foe', intercepted: true });
        expect(getShotOutcome(impact({ intercepted: true }), 'me')).toEqual({ outcome: 'hit', targetId: 'foe', system: 'helm', intercepted: true });
    });

    it('reports an impact that did no damage as absorbed by shields', () => {
        expect(getShotOutcome(impact({ damage: 0 }), 'me')).toEqual({ outcome: 'absorbed', targetId: 'foe', system: undefined });
    });

    it('ignores other ships\' shots and other effects', () => {
        expect(getShotOutcome(shot({ missed: true, sourceId: 'other' }), 'me')).toBeNull();
        expect(getShotOutcome(impact({ sourceId: 'other' }), 'me')).toBeNull();
        expect(getShotOutcome({ type: 'warpAway', sourceId: 'me' } as WeaponEffect, 'me')).toBeNull();
    });
});

describe('addShotResult', () => {
    const miss = { outcome: 'miss', targetId: 'foe' } as const;
    const hit = { outcome: 'hit', targetId: 'foe', system: 'helm' } as const;

    it('does not merge an intercepted shot with one that was not', () => {
        const results = addShotResult(addShotResult([], miss, 0, 1), { ...miss, intercepted: true }, 100, 2);
        expect(results).toHaveLength(2);
    });

    it('merges a repeat of the latest outcome into one result, renewing its time', () => {
        let results = addShotResult([], miss, 0, 1);
        results = addShotResult(results, miss, 500, 2);

        expect(results).toEqual([{ ...miss, id: 2, count: 2, expiresAt: 500 + shotResultLifetime }]);
    });

    it('starts a new result for a different outcome, target or system', () => {
        let results = addShotResult([], miss, 0, 1);
        results = addShotResult(results, hit, 10, 2);
        results = addShotResult(results, { ...hit, system: 'hull' }, 20, 3);
        results = addShotResult(results, { ...hit, system: 'hull', targetId: 'other' }, 30, 4);

        expect(results.map(result => result.id)).toEqual([2, 3, 4]);
    });

    it('drops expired results and keeps no more than the maximum', () => {
        let results = addShotResult([], miss, 0, 0);
        results = addShotResult(results, hit, shotResultLifetime + 1, 1);
        expect(results.map(result => result.id)).toEqual([1]);

        for (let i = 0; i < maxShotResults + 2; i++) {
            results = addShotResult(results, { ...hit, targetId: `t${i}` }, shotResultLifetime + 2, 10 + i);
        }
        expect(results).toHaveLength(maxShotResults);
        expect(results[results.length - 1].id).toBe(10 + maxShotResults + 1);
    });
});

describe('describeShotResult', () => {
    const result = (extra: Partial<ShotResult>): ShotResult => ({ outcome: 'miss', targetId: 'foe', id: 1, count: 1, expiresAt: 0, ...extra });

    it('describes each outcome', () => {
        expect(describeShotResult(result({}), 'foe', 'Raider')).toBe('Miss');
        expect(describeShotResult(result({ outcome: 'hit' }), 'foe', 'Raider')).toBe('Hit');
        expect(describeShotResult(result({ outcome: 'hit', system: 'helm' }), 'foe', 'Raider')).toBe('Hit · Helm');
        expect(describeShotResult(result({ outcome: 'absorbed' }), 'foe', 'Raider')).toBe('Absorbed by shields');
    });

    it('shows how many shots in a row, and names a target other than the one shown', () => {
        expect(describeShotResult(result({ outcome: 'hit', system: 'hull', count: 3 }), 'foe', 'Raider')).toBe('Hit · Hull ×3');
        expect(describeShotResult(result({}), 'other', 'Raider')).toBe('Miss · Raider');
        expect(describeShotResult(result({}), 'other', undefined)).toBe('Miss');
    });

    it('says when an interposing ship took the shot', () => {
        expect(describeShotResult(result({ outcome: 'hit', system: 'helm', intercepted: true }), 'foe', 'Raider')).toBe('Intercepted · Hit · Helm');
        expect(describeShotResult(result({ intercepted: true, count: 2 }), 'other', 'Escort')).toBe('Intercepted · Miss ×2 · Escort');
    });
});

import { ImpactEffect, ShotEffect } from 'common-data/features/space/types/WeaponEffect';
import { describe, expect, it } from 'vitest';
import { findBeamImpact, getProjectilePoint, getShotAim, shieldRadius } from './shotPaths';

const source = { x: 0, y: 0, angle: 0 };
const target = { x: 10, y: 0 };

const shot: ShotEffect = { type: 'shot', weapon: 'phaserCannon', sourceId: 'a', targetId: 'b', startTime: 100 };
const impact = (damage: number): ImpactEffect => ({ type: 'impact', sourceId: 'a', targetId: 'b', damage, startTime: 100 });

describe('getShotAim', () => {
    it('stops at the shields if nothing got through them', () => {
        expect(getShotAim(shot, source, target, impact(0)).endX).toBeCloseTo(10 - shieldRadius);
    });

    it('reaches the hull if damage got through the shields', () => {
        expect(getShotAim(shot, source, target, impact(3)).endX).toBeGreaterThan(10 - shieldRadius);
    });

    it('goes wide of the target and well past it on a miss', () => {
        const aim = getShotAim({ ...shot, missed: true }, source, target);

        expect(aim.endX).toBeGreaterThan(target.x + 5);
        expect(Math.abs(aim.dy)).toBeGreaterThan(0.1);
    });

    it('goes straight ahead with no target', () => {
        const aim = getShotAim({ ...shot, targetId: undefined }, source, undefined);

        expect(aim.dx).toBeCloseTo(1);
        expect(aim.dy).toBeCloseTo(0);
    });
});

describe('findBeamImpact', () => {
    it('finds the impact from the same moment, between the same ships', () => {
        const match = impact(1);

        expect(findBeamImpact(shot, [{ ...match, startTime: 300 }, { ...match, targetId: 'c' }, match])).toBe(match);
    });

    it('finds nothing for a shot that has not landed', () => {
        expect(findBeamImpact(shot, [])).toBeUndefined();
    });
});

describe('getProjectilePoint', () => {
    const aim = getShotAim({ ...shot, weapon: 'photonTorpedo' }, source, target);

    it('starts from where it was launched, however the source has moved since', () => {
        const launch = { x: -5, y: 2 };

        expect(getProjectilePoint(aim, launch, 0, false)).toEqual(launch);
    });

    it('arrives at the shields of its target', () => {
        const end = getProjectilePoint(aim, source, 1, false);

        expect(end.x).toBeCloseTo(10 - shieldRadius);
        expect(end.y).toBeCloseTo(0);
    });

    it('curves on the way', () => {
        expect(getProjectilePoint(aim, source, 0.5, false).y).not.toBeCloseTo(0);
    });
});

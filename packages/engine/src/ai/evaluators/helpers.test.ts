import { ArraySchema } from '@colyseus/schema';
import { ClockTimer } from '@colyseus/timer';
import { CardMotionSegmentFacing, LocationTargetCardDefinition } from 'common-data/features/cards/types/CardDefinition';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { AiShip } from 'src/state/AiShip';
import { CardState } from 'src/state/CardState';
import { GameState } from 'src/state/GameState';
import { MotionKeyframe } from 'src/state/MotionKeyframe';
import { WeaponSlotState } from 'src/state/systems/tactical/WeaponSlotState';
import { shipSetup } from 'src/testUtils';
import { IdProvider } from 'src/types/IdProvider';
import { describe, it, expect } from 'vitest';
import { ResolvedAiConfig } from '../types';
import { rangeBandScore, estimateManeuverEndpoint, projectCurrentEndpoint, getDesiredRangeFromSlots, priorityFor } from './helpers';

const straightMove: LocationTargetCardDefinition = {
    targetType: 'location',
    crew: 'helm',
    startFacing: CardMotionSegmentFacing.FinalVector,
    endFacing: CardMotionSegmentFacing.FinalVector,
    baseRotationSpeed: 1,
    baseSpeed: 1,
    minDistance: 3,
    parameters: { cost: 1, evasion: 0 },
};

describe('rangeBandScore', () => {
    it('is 1 inside the band and lower outside', () => {
        const band = { min: 2, max: 8 };
        expect(rangeBandScore(5, band)).toBe(1);
        expect(rangeBandScore(2, band)).toBe(1);
        expect(rangeBandScore(20, band)).toBeLessThan(0.5);
        expect(rangeBandScore(20, band)).toBeGreaterThanOrEqual(0);
    });

    it('treats a zero-width band (min === max) as a single point with width 1', () => {
        const band = { min: 5, max: 5 };
        expect(rangeBandScore(5, band)).toBe(1);
        expect(rangeBandScore(6, band)).toBeCloseTo(1 - 1 / 3);
        expect(rangeBandScore(8, band)).toBe(0);
    });
});

describe('estimateManeuverEndpoint', () => {
    const from = { x: 0, y: 0, angle: 0 };

    it('returns the location and end facing for a straight move', () => {
        const end = estimateManeuverEndpoint(straightMove, from, { x: 10, y: 0 });
        expect(end).not.toBeNull();
        expect(end!.x).toBe(10);
        expect(end!.y).toBe(0);
    });

    it('respects minDistance', () => {
        expect(estimateManeuverEndpoint(straightMove, from, { x: 1, y: 0 })).toBeNull();
    });

    it('respects maxDistance', () => {
        const withMaxDistance = { ...straightMove, maxDistance: 5 };
        expect(estimateManeuverEndpoint(withMaxDistance, from, { x: 10, y: 0 })).toBeNull();
    });

    it('keeps position for rotate-only cards', () => {
        const rotateOnly = { ...straightMove, baseSpeed: 0, minDistance: undefined };
        const end = estimateManeuverEndpoint(rotateOnly, from, { x: 10, y: 0 });
        expect(end!.x).toBe(0);
        expect(end!.y).toBe(0);
    });
});

describe('projectCurrentEndpoint', () => {
    it('returns the final motion keyframe, not the initial one', () => {
        let nextId = 1;
        const idPool: IdProvider = { getId: () => String(nextId++), releaseId: () => {} };
        const state = new GameState(idPool, new ClockTimer(false));
        const ship = new AiShip(state, { ...shipSetup('raiders', 0, 0), goal: { type: 'search-and-destroy' }, skill: 1 });
        ship.motion.push(new MotionKeyframe(1000, 10, 20, 0.5));

        const end = projectCurrentEndpoint(ship);
        expect(end).toEqual({ x: 10, y: 20, angle: 0.5 });
    });
});

describe('getDesiredRangeFromSlots', () => {
    function slotWith(id: string, cardType?: CardType): WeaponSlotState {
        const slot = new WeaponSlotState(id);
        if (cardType) {
            slot.card = new CardState(1, cardType);
        }
        return slot;
    }

    it('returns null when no slot has a loaded weapon', () => {
        const slots = new ArraySchema<WeaponSlotState>(slotWith('0'));
        expect(getDesiredRangeFromSlots(slots)).toBeNull();
    });

    it('combines the tightest min/max range across loaded weapon slots', () => {
        // phaserCannon: maxRange 10, no minRange (defaults to 0). phaserStrip: maxRange 6.
        const slots = new ArraySchema<WeaponSlotState>(slotWith('0', 'phaserCannon'), slotWith('1', 'phaserStrip'));
        expect(getDesiredRangeFromSlots(slots)).toEqual({ min: 0, max: 6 });
    });
});

describe('priorityFor', () => {
    const config: ResolvedAiConfig = {
        goal: { type: 'search-and-destroy' },
        skill: 1,
        fleeThreshold: 0.25,
        priorities: { helm: 2, tactical: 3, science: 4, engineer: 5 },
    };

    it('always returns 1 for hull/reactor, regardless of config', () => {
        expect(priorityFor('hull', config)).toBe(1);
        expect(priorityFor('reactor', config)).toBe(1);
    });

    it('reads crew role priorities from config.priorities', () => {
        expect(priorityFor('helm', config)).toBe(2);
        expect(priorityFor('tactical', config)).toBe(3);
        expect(priorityFor('science', config)).toBe(4);
        expect(priorityFor('engineer', config)).toBe(5);
    });
});

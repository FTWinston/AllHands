import { describe, expect, it } from 'vitest';
import { cardDefinitions } from './cardDefinitions';
import { isKnowableCardType, knowableCardTypes, knowableCardTypesByRole } from './getKnowableCardTypes';
import type { CardDefinition } from '../types/CardDefinition';

describe('knowable card types', () => {
    it('are the non-expendable crew cards that can be in a deck', () => {
        expect(isKnowableCardType('phaserCannon')).toBe(true);
        expect(isKnowableCardType('sweep')).toBe(true);

        expect(isKnowableCardType('auxPower')).toBe(false); // Expendable
        expect(isKnowableCardType('warpAway')).toBe(false); // Campaign card
        expect(isKnowableCardType('sweepLeft')).toBe(false); // Choice option
        expect(isKnowableCardType('exampleNoTarget')).toBe(false); // Placeholder
        expect(isKnowableCardType('reactorPowerHelm')).toBe(false); // Not a crew card
        expect(isKnowableCardType('notACard')).toBe(false);
    });

    it('are grouped by the crew member whose deck they go in', () => {
        for (const [role, types] of Object.entries(knowableCardTypesByRole)) {
            expect(types.length).toBeGreaterThan(0);
            for (const type of types) {
                expect((cardDefinitions[type] as CardDefinition).system).toBe(role);
                expect(knowableCardTypes.has(type)).toBe(true);
            }
        }
    });
});

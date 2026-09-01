import { type IMap, type Snapshot } from '@colyseus/react';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { describe, expect, it } from 'vitest';
import { getWeaponArcParameters, WeaponArcSlotInfo } from './drawWeaponArcs';

import type { CardInstance } from 'common-data/features/cards/types/CardInstance';

/** CardInstance.modifiers is typed as an IMap for the engine's use, but plain objects work fine at runtime. */
function card(type: CardType, modifiers?: Snapshot<IMap<string, number>>): Snapshot<CardInstance> {
    return { id: 1, type, modifiers };
}

describe('getWeaponArcParameters', () => {
    it('returns null for an unequipped slot', () => {
        const slot: Snapshot<WeaponArcSlotInfo> = { card: null };
        expect(getWeaponArcParameters(slot)).toBeNull();
    });

    it('returns the maxRange and firingArc for an equipped weapon-slot card', () => {
        const slot: Snapshot<WeaponArcSlotInfo> = { card: card('phaserCannon') };
        expect(getWeaponArcParameters(slot)).toEqual({ maxRange: 10, firingArc: 1 });
    });

    it('applies card and slot modifiers to the resolved parameters', () => {
        const slot: Snapshot<WeaponArcSlotInfo> = {
            card: card('phaserCannon', { maxRange: 5 }),
            modifiers: { firingArc: 0.5 },
        };
        expect(getWeaponArcParameters(slot)).toEqual({ maxRange: 15, firingArc: 1.5 });
    });

    it('returns null for a card that is not a weapon-slot card', () => {
        const slot: Snapshot<WeaponArcSlotInfo> = { card: card('flare') };
        expect(getWeaponArcParameters(slot)).toBeNull();
    });

    it('returns null when resolved maxRange or firingArc is not positive', () => {
        const slot: Snapshot<WeaponArcSlotInfo> = { card: card('phaserCannon', { firingArc: -1 }) };
        expect(getWeaponArcParameters(slot)).toBeNull();
    });
});

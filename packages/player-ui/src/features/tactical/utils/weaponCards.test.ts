import { cardDefinitions } from 'common-data/features/cards/utils/cardDefinitions';
import { describe, expect, it } from 'vitest';
import { getLockPips, maxLockLevel } from './lockPips';
import { canPlayOnWeapon, getChargeValue } from './weaponCards';

const cannon = { type: 'phaserCannon' as const };
const torpedo = { type: 'photonTorpedo' as const };

describe('canPlayOnWeapon', () => {
    it('lets a modifier be played only on a loaded weapon without one', () => {
        const modifier = cardDefinitions.extendedUse;

        expect(canPlayOnWeapon(modifier, { card: cannon, modified: false })).toBe(true);
        expect(canPlayOnWeapon(modifier, { card: cannon, modified: true })).toBe(false);
        expect(canPlayOnWeapon(modifier, { card: null, modified: false })).toBe(false);
    });

    it('lets an instant card be played on any loaded weapon, modified or not', () => {
        const instant = cardDefinitions.powerCell;
        expect(instant.instant).toBe(true);

        expect(canPlayOnWeapon(instant, { card: cannon, modified: false })).toBe(true);
        expect(canPlayOnWeapon(instant, { card: cannon, modified: true })).toBe(true);
        expect(canPlayOnWeapon(instant, { card: null, modified: false })).toBe(false);
    });

    it('still needs the weapon to have the trait the card requires, instant or not', () => {
        expect(canPlayOnWeapon(cardDefinitions.precisionFocus, { card: torpedo, modified: false })).toBe(false);
        expect(canPlayOnWeapon(cardDefinitions.precisionFocus, { card: cannon, modified: false })).toBe(true);
        expect(canPlayOnWeapon({ targetType: 'weapon', requiredWeaponTrait: 'energyWeapon', instant: true }, { card: torpedo, modified: true })).toBe(false);
        expect(canPlayOnWeapon({ targetType: 'weapon', requiredWeaponTrait: 'energyWeapon', instant: true }, { card: cannon, modified: true })).toBe(true);
    });
});

describe('getChargeValue', () => {
    it('is a card\'s chargeValue parameter, where it has one', () => {
        expect(getChargeValue({ type: 'powerCell' })).toBe(5);
    });

    it('is otherwise its cost, including any change to that', () => {
        expect(getChargeValue({ type: 'phaserCannon' })).toBe(3);
        expect(getChargeValue({ type: 'phaserCannon', modifiers: { cost: -1 } })).toBe(2);
    });
});

describe('getLockPips', () => {
    it(`shows a filled pip for each level of Lock, out of ${maxLockLevel}`, () => {
        expect(maxLockLevel).toBe(5);
        expect(getLockPips(3)).toBe('●●●○○');
        expect(getLockPips(0)).toBe('○○○○○');
        expect(getLockPips(9)).toBe('●●●●●');
    });
});

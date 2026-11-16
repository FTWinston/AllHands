import { cardDefinitions } from 'common-data/features/cards/utils/cardDefinitions';
import { describe, expect, it } from 'vitest';
import { getLockPips, maxLockLevel } from './lockPips';
import { canChargeWeapon, canPlayOnWeapon, getChargeValue, hasCardTrait, isWeaponActive } from './weaponCards';

const cannon = { type: 'phaserCannon' as const };
const torpedo = { type: 'photonTorpedo' as const };
const tractorBeam = { type: 'tractorBeam' as const };

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

describe('an energised weapon', () => {
    it('is the Tractor Beam, which is also rechargeable', () => {
        expect(hasCardTrait(tractorBeam, 'energised')).toBe(true);
        expect(hasCardTrait(tractorBeam, 'rechargeable')).toBe(true);
        expect(hasCardTrait(cannon, 'energised')).toBe(false);
    });

    it('can\'t take a modifier, but can still have an instant card played on it', () => {
        expect(canPlayOnWeapon(cardDefinitions.extendedUse, { card: tractorBeam, modified: false })).toBe(false);
        expect(canPlayOnWeapon(cardDefinitions.powerCell, { card: tractorBeam, modified: false })).toBe(true);
        expect(canPlayOnWeapon(cardDefinitions.hotSwap, { card: tractorBeam, modified: false })).toBe(true);
    });

    it('counts a gained trait as well as its definition\'s', () => {
        expect(canPlayOnWeapon(cardDefinitions.extendedUse, { card: { ...cannon, extraTraits: { energised: 0 } }, modified: false })).toBe(false);
    });
});

describe('canChargeWeapon', () => {
    it('lets a weapon be charged until it\'s first full, and not after', () => {
        expect(canChargeWeapon({ card: cannon, charge: 0, hasBeenFullyCharged: false }, 8)).toBe(true);
        expect(canChargeWeapon({ card: cannon, charge: 8, hasBeenFullyCharged: true }, 8)).toBe(false);
        expect(canChargeWeapon({ card: cannon, charge: 6, hasBeenFullyCharged: true }, 8)).toBe(false);
        expect(canChargeWeapon({ card: null, charge: 0, hasBeenFullyCharged: false }, 8)).toBe(false);
    });

    it('lets a rechargeable weapon go on being charged after it\'s been full, whenever it has room', () => {
        const rechargeable = { card: { ...cannon, extraTraits: { rechargeable: 1 } }, hasBeenFullyCharged: true };
        expect(canChargeWeapon({ ...rechargeable, charge: 2 }, 8)).toBe(true);
        expect(canChargeWeapon({ ...rechargeable, charge: 7 }, 8)).toBe(true);
        expect(canChargeWeapon({ ...rechargeable, charge: 8 }, 8)).toBe(false);
    });

    it('lets a Tractor Beam be charged once it has lost charge, active or not, as it\'s rechargeable', () => {
        expect(canChargeWeapon({ card: tractorBeam, charge: 8, hasBeenFullyCharged: true }, 8)).toBe(false);
        expect(canChargeWeapon({ card: tractorBeam, charge: 3, hasBeenFullyCharged: true }, 8)).toBe(true);
    });
});

describe('isWeaponActive', () => {
    it('is whether the slot names a target its weapon is active on', () => {
        expect(isWeaponActive({ activeTargetId: 'enemy' })).toBe(true);
        expect(isWeaponActive({ activeTargetId: '' })).toBe(false);
        expect(isWeaponActive({})).toBe(false);
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

import { defineUiContent } from 'common-ui/content/UiContent';
import { Parameter } from 'common-ui/features/cards/components/Parameter';
import { Trait } from 'common-ui/features/cards/components/Trait';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { tacticalShared } from './tactical.shared';

export const tacticalUi = defineUiContent({
    shared: tacticalShared,
    cards: {
        flare: {
            name: 'Flare',
            description: <>
                Launch a bright flare, which burns for
                {' '}
                <Parameter name="duration" />
                {' '}
                seconds and dazzles sensors nearby.
            </>,
            image: <ExampleIcon />,
        },
        phaserCannon: {
            name: 'Phaser Cannon',
            description: <>
                A short-range
                {' '}
                <Trait trait="energyWeapon" />
                {' '}
                dealing
                {' '}
                <Parameter name="damage" />
                {' '}
                damage, with a narrow field of fire.
            </>,
            image: <ExampleIcon />,
        },
        phaserStrip: {
            name: 'Phaser Strip',
            description: <>
                A medium-range
                {' '}
                <Trait trait="energyWeapon" />
                {' '}
                dealing
                {' '}
                <Parameter name="damage" />
                {' '}
                damage, with a wide field of fire.
            </>,
            image: <ExampleIcon />,
        },
        photonicCannon: {
            name: 'Photonic Cannon',
            description: <>
                An advanced
                {' '}
                <Trait trait="energyWeapon" />
                {' '}
                dealing
                {' '}
                <Parameter name="damage" />
                {' '}
                damage with devastating photonic blasts.
            </>,
            image: <ExampleIcon />,
        },
        photonTorpedo: {
            name: 'Photon Torpedo',
            description: <>
                A long-range
                {' '}
                <Trait trait="torpedoWeapon" />
                {' '}
                dealing
                {' '}
                <Parameter name="damage" />
                {' '}
                damage.
            </>,
            image: <ExampleIcon />,
        },
        quantumTorpedo: {
            name: 'Quantum Torpedo',
            description: <>
                A medium-range
                {' '}
                <Trait trait="torpedoWeapon" />
                {' '}
                dealing
                {' '}
                <Parameter name="damage" />
                {' '}
                damage.
            </>,
            image: <ExampleIcon />,
        },
        lowYield: {
            name: 'Low Yield',
            description: <>
                Reduce a
                {' '}
                <Trait trait="torpedoWeapon" external />
                {' '}
                damage by
                {' '}
                <Parameter name="damageReduction" />
                {' '}
                and charge per use by
                {' '}
                <Parameter name="chargeReduction" />
                . Total charge becomes one use.
            </>,
            image: <ExampleIcon />,
        },
        highYield: {
            name: 'High Yield',
            description: <>
                Increase a
                {' '}
                <Trait trait="torpedoWeapon" external />
                {' '}
                damage by
                {' '}
                <Parameter name="damageIncrease" />
                {' '}
                and charge per use by
                {' '}
                <Parameter name="chargeIncrease" />
                . Total charge becomes one use.
            </>,
            image: <ExampleIcon />,
        },
        extendedRange: {
            name: 'Extended Range',
            description: <>
                Reduce a
                {' '}
                <Trait trait="torpedoWeapon" external />
                {' '}
                damage by
                {' '}
                <Parameter name="damageReduction" />
                {' '}
                and increase its maximum range by
                {' '}
                <Parameter name="maxRangeIncrease" />
                {' '}
                and minimum range by
                {' '}
                <Parameter name="minRangeIncrease" />
                .
            </>,
            image: <ExampleIcon />,
        },
        projectileManoeuvrability: {
            name: 'Projectile Manoeuvrability',
            description: <>
                Increase a
                {' '}
                <Trait trait="torpedoWeapon" external />
                {' '}
                charge per use by
                {' '}
                <Parameter name="chargeIncrease" />
                , its firing arc by
                {' '}
                <Parameter name="firingArcIncrease" />
                {' '}
                and its accuracy by
                {' '}
                <Parameter name="accuracyIncrease" />
                %.
            </>,
            image: <ExampleIcon />,
        },
        fullSpread: {
            name: 'Full Spread',
            description: <>
                A
                {' '}
                <Trait trait="torpedoWeapon" external />
                {' '}
                fires
                {' '}
                <Parameter name="extraShots" />
                {' '}
                extra times, but deals
                {' '}
                <Parameter name="damageReduction" />
                {' '}
                less damage, has
                {' '}
                <Parameter name="accuracyReduction" />
                % less accuracy and uses
                {' '}
                <Parameter name="chargeMultiplier" />
                % charge per use. Total charge becomes one use.
            </>,
            image: <ExampleIcon />,
        },
        highIntensity: {
            name: 'High Intensity',
            description: <>
                Increase an
                {' '}
                <Trait trait="energyWeapon" external />
                {' '}
                damage by
                {' '}
                <Parameter name="damageIncrease" />
                {' '}
                and charge per use by
                {' '}
                <Parameter name="chargeIncrease" />
                , but narrow its firing arc by
                {' '}
                <Parameter name="firingArcReduction" />
                .
            </>,
            image: <ExampleIcon />,
        },
        lensingEnhancement: {
            name: 'Lensing Enhancement',
            description: <>
                Widen an
                {' '}
                <Trait trait="energyWeapon" external />
                {' '}
                firing arc by
                {' '}
                <Parameter name="firingArcIncrease" />
                {' '}
                and increase its damage by
                {' '}
                <Parameter name="damageIncrease" />
                {' '}
                and charge per use by
                {' '}
                <Parameter name="chargeIncrease" />
                .
            </>,
            image: <ExampleIcon />,
        },
        precisionFocus: {
            name: 'Precision Focus',
            description: <>
                Increase an
                {' '}
                <Trait trait="energyWeapon" external />
                {' '}
                damage by
                {' '}
                <Parameter name="damageIncrease" />
                {' '}
                and accuracy by
                {' '}
                <Parameter name="accuracyIncrease" />
                % but increase charge per use by
                {' '}
                <Parameter name="chargeIncrease" />
                .
            </>,
            image: <ExampleIcon />,
        },
        subCritical: {
            name: 'Sub-Critical',
            description: <>
                Reduces damage of an
                {' '}
                <Trait trait="energyWeapon" external />
                {' '}
                to
                {' '}
                <Parameter name="damageMultiplier" />
                % of normal, to reduce its charge per use by
                {' '}
                <Parameter name="chargeReduction" />
                {' '}
                and increase its total charge by
                {' '}
                <Parameter name="totalChargeIncrease" />
                .
            </>,
            image: <ExampleIcon />,
        },
        weaponOvercharge: {
            name: 'Overcharge',
            description: <>
                Increase the charge per use of an
                {' '}
                <Trait trait="energyWeapon" external />
                {' '}
                by
                {' '}
                <Parameter name="chargeIncrease" />
                {' '}
                and damage by
                {' '}
                <Parameter name="damageIncrease" />
                , increasing its total charge by
                {' '}
                <Parameter name="totalChargeIncrease" />
                , and dealing
                {' '}
                <Parameter name="selfDamage" />
                {' '}
                self-damage.
            </>,
            image: <ExampleIcon />,
        },
        rapidFire: {
            name: 'Rapid Fire',
            description: <>
                An
                {' '}
                <Trait trait="energyWeapon" external />
                {' '}
                fires
                {' '}
                <Parameter name="extraShots" />
                {' '}
                extra times, but deals
                {' '}
                <Parameter name="damageReduction" />
                {' '}
                less damage and uses
                {' '}
                <Parameter name="chargeMultiplier" />
                % charge per use. Total charge becomes one use.
            </>,
            image: <ExampleIcon />,
        },
        ionicSurge: {
            name: 'Ionic Surge',
            description: <>
                Add the
                {' '}
                <Trait trait="dampening" />
                {' '}
                and
                {' '}
                <Trait trait="draining" />
                {' '}
                effects to the weapon,
                but reduce its damage by
                {' '}
                <Parameter name="damageReduction" />
                {' '}
                and increase its charge per use by
                {' '}
                <Parameter name="chargeIncrease" />
                .
            </>,
            image: <ExampleIcon />,
        },
        extendedUse: {
            name: 'Extended Use',
            description: <>
                Increase a weapon's total charge by
                {' '}
                <Parameter name="totalChargeIncrease" />
                .
            </>,
            image: <ExampleIcon />,
        },
        efficiency: {
            name: 'Efficiency',
            description: <>
                Reduce a weapon's charge per use by
                {' '}
                <Parameter name="chargeReduction" />
                .
            </>,
            image: <ExampleIcon />,
        },
        rechargeable: {
            name: 'Rechargeable',
            description: <>
                Give a weapon the
                {' '}
                <Trait trait="rechargeable" external />
                {' '}
                trait, so it can be topped up with one more card once fully charged.
            </>,
            image: <ExampleIcon />,
        },
        exampleEnemyTarget: {
            name: 'Example Enemy Target',
            description: 'An example card that targets an enemy.',
            image: <ExampleIcon />,
        },
    },
    effects: {
        flareBurning: {
            name: 'Flare Burning',
            description: <>A flare launched from this ship is burning, dazzling sensors nearby.</>,
            image: ExampleIcon,
        },
    },
});

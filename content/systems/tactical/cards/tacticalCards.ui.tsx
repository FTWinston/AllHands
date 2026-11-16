import { defineUiCards } from 'common-ui/content/UiContent';
import { Parameter } from 'common-ui/features/cards/components/Parameter';
import { Trait } from 'common-ui/features/cards/components/Trait';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { cards as sharedCards } from './tacticalCards.shared';

export const cards = defineUiCards(sharedCards, {
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
    siegeLance: {
        name: 'Siege Lance',
        description: <>
            A long-range, narrow
            {' '}
            <Trait trait="energyWeapon" />
            {' '}
            dealing
            {' '}
            <Parameter name="damage" />
            {' '}
            damage. It's
            {' '}
            <Trait trait="cumbersome" />
            : its target must be held in its arc for 2 seconds before it can fire.
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
            trait, so it can go on being charged after it's fully charged, any number of times.
        </>,
        image: <ExampleIcon />,
    },
    acquireLock: {
        name: 'Acquire Lock',
        description: <>
            Gain
            {' '}
            <Parameter name="lockGain" />
            {' '}
            Lock on a ship, losing any held on another. Each level makes every shot at it
            {' '}
            <Parameter name="accuracyPerLevel" />
            % more accurate. Lock fades by a level every
            {' '}
            <Parameter name="fadeSeconds" />
            s since it was last gained.
        </>,
        image: <ExampleIcon />,
    },
    alphaStrike: {
        name: 'Alpha Strike',
        description: <>
            Fire every weapon that can fire at the locked ship, at once, using each one up. Spend all Lock: each shot does
            {' '}
            <Parameter name="damagePerLock" />
            {' '}
            more damage per level.
        </>,
        image: <ExampleIcon />,
    },
    holdFire: {
        name: 'Hold Fire',
        description: <>
            For
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds, weapons can't fire. When it ends, gain
            {' '}
            <Parameter name="lockGain" />
            {' '}
            Lock on the locked ship. Needs a ship to be locked.
        </>,
        image: <ExampleIcon />,
    },
    calledShot: {
        name: 'Called Shot',
        description: <>
            Spend
            {' '}
            <Parameter name="lockCost" />
            {' '}
            Lock: every crew system of the locked ship can be aimed at, even if science hasn't identified it, until the next shot at that ship, or for
            {' '}
            <Parameter name="duration" />
            {' '}
            seconds.
        </>,
        image: <ExampleIcon />,
    },
    powerCell: {
        name: 'Power Cell',
        description: <>
            Give a weapon
            {' '}
            <Parameter name="charge" />
            {' '}
            charge, without modifying it. Spent as charge instead, it's worth
            {' '}
            <Parameter name="chargeValue" />
            .
        </>,
        image: <ExampleIcon />,
    },
    hotSwap: {
        name: 'Hot Swap',
        description: <>
            Take all the charge from your other weapon, as far as this one can hold it, without modifying it.
        </>,
        image: <ExampleIcon />,
    },
    tractorBeam: {
        name: 'Tractor Beam',
        description: <>
            An
            {' '}
            <Trait trait="energised" />
            ,
            {' '}
            <Trait trait="rechargeable" />
            {' '}
            weapon that holds a ship, cancelling its manoeuvre and slowing its manoeuvres by
            {' '}
            <Parameter name="targetSlowdown" />
            %. Your own manoeuvres are slowed by
            {' '}
            <Parameter name="ownSlowdown" />
            % while it holds. Gain
            {' '}
            <Parameter name="lockGain" />
            {' '}
            Lock on the ship. Holds until it runs out of charge, losing
            {' '}
            <Parameter name="drainPerSecond" />
            {' '}
            a second. The ship can break free by starting a manoeuvre with more power at its helm than your tactical has.
        </>,
        image: <ExampleIcon />,
    },
    steadyFire: {
        name: 'Steady Fire',
        description: <>
            Each shot from a weapon makes its next one
            {' '}
            <Parameter name="accuracyPerShot" />
            % more accurate, up to
            {' '}
            <Parameter name="maxStackedAccuracy" />
            % more, for as long as it's in its slot.
        </>,
        image: <ExampleIcon />,
    },
    disablingShot: {
        name: 'Disabling Shot',
        description: <>
            A weapon's hits damage the cards of the system they land on, but not the ship's hull.
        </>,
        image: <ExampleIcon />,
    },
    tracerRound: {
        name: 'Tracer Round',
        description: <>
            When a weapon hits a system, science is shown it, as if scanned, unless science is scanning something already.
        </>,
        image: <ExampleIcon />,
    },
    exploit: {
        name: 'Exploit',
        description: <>
            A weapon's shots aimed at a system do
            {' '}
            <Parameter name="damagePerNegativeEffect" />
            {' '}
            more damage for each negative effect on that system.
        </>,
        image: <ExampleIcon />,
    },
    plasmaWarhead: {
        name: 'Plasma Warhead',
        description: <>
            A
            {' '}
            <Trait trait="torpedoWeapon" external />
            {' '}
            gains
            {' '}
            <Trait trait="persistent" />
            , but its damage is reduced by
            {' '}
            <Parameter name="damageReduction" />
            .
        </>,
        image: <ExampleIcon />,
    },
    proximityFuse: {
        name: 'Proximity Fuse',
        description: <>
            A
            {' '}
            <Trait trait="torpedoWeapon" external />
            {' '}
            gains
            {' '}
            <Trait trait="area" />
            , and its accuracy is increased by
            {' '}
            <Parameter name="accuracyIncrease" />
            .
        </>,
        image: <ExampleIcon />,
    },
    phaseShift: {
        name: 'Phase Shift',
        description: <>
            An
            {' '}
            <Trait trait="energyWeapon" external />
            {' '}
            gains
            {' '}
            <Trait trait="penetrating" />
            , but its charge per use is increased by
            {' '}
            <Parameter name="chargeIncrease" />
            .
        </>,
        image: <ExampleIcon />,
    },
    exampleEnemyTarget: {
        name: 'Example Enemy Target',
        description: 'An example card that targets an enemy.',
        image: <ExampleIcon />,
    },
});

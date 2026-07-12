import { CardType, cardDefinitions } from 'common-data/features/cards/utils/cardDefinitions';
import { default as ExampleIcon } from '../../../icons/exampleIcon.svg?react';
import { Parameter } from '../components/Parameter';
import { Trait } from '../components/Trait';
import { CardDescription, UICardDefinition } from '../types/UICardDefinition';

function loadCardDefinitions() {
    const cardDescriptions: Record<CardType, CardDescription> = {
        flare: {
            name: 'Flare',
            description: 'A bright flare that can be launched to illuminate an area or signal allies.',
            image: <ExampleIcon />,
        },
        smokeScreen: {
            name: 'Smoke Screen',
            description: 'Deploy a smoke screen to obscure vision and provide cover.',
            image: <ExampleIcon />,
        },
        phaserCannon: {
            name: 'Phaser Cannon',
            description: <>
                A short-range
                {' '}
                <Trait type="energyWeapon" />
                {' '}
                dealing
                {' '}
                <Parameter name="damage" />
                {' '}
                <Parameter name="damageType" />
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
                <Trait type="energyWeapon" />
                {' '}
                dealing
                {' '}
                <Parameter name="damage" />
                {' '}
                <Parameter name="damageType" />
                {' '}
                damage, with a wide field of fire.
            </>,
            image: <ExampleIcon />,
        },
        photonTorpedo: {
            name: 'Photon Torpedo',
            description: <>
                A long-range
                {' '}
                <Trait type="torpedoWeapon" />
                {' '}
                dealing
                {' '}
                <Parameter name="damage" />
                {' '}
                <Parameter name="damageType" />
                {' '}
                damage.
            </>,
            image: <ExampleIcon />,
        },
        photonicCannon: {
            name: 'Photonic Cannon',
            description: <>
                An advanced
                {' '}
                <Trait type="energyWeapon" />
                {' '}
                dealing
                {' '}
                <Parameter name="damage" />
                {' '}
                <Parameter name="damageType" />
                {' '}
                damage with devastating photonic blasts.
            </>,
            image: <ExampleIcon />,
        },

        lowYield: {
            name: 'Low Yield',
            description: <>
                Reduce a
                {' '}
                <Trait type="torpedoWeapon" external />
                {' '}
                damage by
                {' '}
                <Parameter name="damageReduction" />
                {' '}
                and charge cost by
                {' '}
                <Parameter name="chargeReduction" />
                .
            </>,
            image: <ExampleIcon />,
        },
        fullSpread: {
            name: 'Full Spread',
            description: <>
                Increase a
                {' '}
                <Trait type="torpedoWeapon" external />
                {' '}
                damage by
                {' '}
                <Parameter name="damageMultiplier" />
                % but increase charge cost by
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
                <Trait type="energyWeapon" external />
                {' '}
                to
                {' '}
                <Parameter name="damageMultiplier" />
                % of normal, to reduce its charge amount by
                {' '}
                <Parameter name="chargeReduction" />
                {' '}
                and give it
                {' '}
                <Parameter name="extraUses" />
                {' '}
                extra uses.
            </>,
            image: <ExampleIcon />,
        },
        weaponOvercharge: {
            name: 'Overcharge',
            description: <>
                Increase charge capacity of an
                {' '}
                <Trait type="energyWeapon" external />
                {' '}
                by
                {' '}
                <Parameter name="chargeIncrease" />
                {' '}
                and damage by
                {' '}
                <Parameter name="damageIncrease" />
                , reducing it uses by
                {' '}
                <Parameter name="fewerUses" />
                , and dealing
                {' '}
                <Parameter name="selfDamage" />
                {' '}
                self-damage.
            </>,
            image: <ExampleIcon />,
        },
        chargeX: {
            name: 'Charge X',
            description: 'Charges the weapon by the current tactical system energy level.',
            image: <ExampleIcon />,
        },
        ionicSurge: {
            name: 'Ionic Surge',
            description: <>
                If weapon is ion type, increase damage by
                {' '}
                <Parameter name="damageMultiplier" />
                %. Otherwise, change damage type to ion.
            </>,
            image: <ExampleIcon />,
        },
        exampleEnemyTarget: {
            name: 'Example Enemy Target',
            description: 'An example card that targets an enemy.',
            image: <ExampleIcon />,
        },
        slowAndSteady: {
            name: 'Slow & Steady',
            description: <>
                <Trait type="primary" />
                {' '}
                Turn towards a target then move towards it at a steady pace.
            </>,
            image: <ExampleIcon />,
        },
        fullReverse: {
            name: 'Full Reverse',
            description: 'Turn away from the target then reverse slowly towards it.',
            image: <ExampleIcon />,
        },
        zigZag: {
            name: 'Zig-zag',
            description: 'Move from side to side while advancing towards a target, facing it the whole time.',
            descriptionLineHeight: 1.25,
            image: <ExampleIcon />,
        },
        strafe: {
            name: 'Strafe',
            description: 'Slowly move a short distance without rotating at all.',
            image: <ExampleIcon />,
        },
        sweep: {
            name: 'Sweep',
            description: 'Curve towards the destination, turning through 90 degrees during the movement.',
            image: <ExampleIcon />,
        },
        sweepLeft: {
            name: 'Sweep Left',
            description: 'Curve left towards the destination, turning through 90 degrees during the movement.',
            image: <ExampleIcon />,
        },
        sweepRight: {
            name: 'Sweep Right',
            description: 'Curve right towards the destination, turning through 90 degrees during the movement.',
            image: <ExampleIcon />,
        },
        faceTarget: {
            name: 'Face Target',
            description: 'Rotate to face the selected location without moving.',
            image: <ExampleIcon />,
        },
        exampleNoTarget: {
            name: 'Some Card with a title that\'s really quite long',
            nameFontSize: 0.88,
            description: 'A card that has a particular effect, for a particular crew role.',
            image: <ExampleIcon />,
        },
        auxPower: {
            name: 'Aux Power',
            description: <>
                <Trait type="expendable" />
                {' '}
                Increase a system's power level by
                {' '}
                <Parameter name="powerGain" />
                , removing this effect from all other systems.
            </>,
            image: <ExampleIcon />,
        },
        swapSystems: {
            name: 'Swap Systems',
            description: 'Swap the position of a system with its neighbor.',
            image: <ExampleIcon />,
        },
        swapHorizontal: {
            name: 'Swap Horizontal',
            description: 'Swap a system with the one to its left or right.',
            image: <ExampleIcon />,
        },
        swapUp: {
            name: 'Swap Up',
            description: 'Swap a system with the one above it.',
            image: <ExampleIcon />,
        },
        swapDown: {
            name: 'Swap Down',
            description: 'Swap a system with the one below it.',
            image: <ExampleIcon />,
        },
        purge: {
            name: 'Purge',
            description: 'Permanently remove a negative effect from a system.',
            image: <ExampleIcon />,
        },
        reset: {
            name: 'Reset',
            description: <>
                Disables all power to a system for
                <Parameter name="duration" />
                {' '}
                seconds, then remove all effects.
            </>,
            image: <ExampleIcon />,
        },
        focusShields: {
            name: 'Focus Shields',
            description: <>
                Focus shields on a system, increasing its protection by
                <Parameter name="shieldBoost" />
                % but decreasing the protection of all other systems (except the hull) by
                <Parameter name="shieldReduction" />
                %.
            </>,
            image: <ExampleIcon />,
        },
        relocateSystem: {
            name: 'Relocate System',
            description: 'Mark a system for relocation. Adds a Relocate Here card to your hand to place it in any position.',
            image: <ExampleIcon />,
        },
        relocateHere: {
            name: 'Relocate Here',
            description: <>
                <Trait type="expendable" />
                {' '}
                Swap the marked system with the targeted system.
            </>,
            image: <ExampleIcon />,
        },
        sustain: {
            name: 'Sustain',
            description: 'Restart the cooldown on every status effect on a system.',
            image: <ExampleIcon />,
        },
        distributePower: {
            name: 'Distribute Power',
            description: <>
                Reduce a system's power by
                <Parameter name="powerChange" />
                {' '}
                per adjacent system, increasing the power of each adjacent system by
                <Parameter name="powerChange" />
                {' '}
                for
                <Parameter name="duration" />
                {' '}
                seconds.
            </>,
            image: <ExampleIcon />,
        },
        drawPower: {
            name: 'Draw Power',
            description: <>
                Increase a system's power by
                <Parameter name="powerChange" />
                {' '}
                per adjacent system, decreasing the power of each adjacent system by
                <Parameter name="powerChange" />
                {' '}
                for
                <Parameter name="duration" />
                {' '}
                seconds.
            </>,
            image: <ExampleIcon />,
        },
        divertAllPower: {
            name: 'Divert All Power',
            description: <>
                All other systems lose
                <Parameter name="lossPerSystem" />
                {' '}
                power for
                <Parameter name="duration" />
                {' '}
                seconds. Target system gains
                <Parameter name="targetGain" />
                {' '}
                power.
            </>,
            image: <ExampleIcon />,
        },
        divertSystemPower: {
            name: 'Divert System Power',
            description: 'Choose which system to divert power from.',
            image: <ExampleIcon />,
        },
        divertHelm: {
            name: 'Divert Helm',
            description: <>
                Reduce helm power by up to
                <Parameter name="maxAmount" />
                , increasing target system power by the same amount for
                <Parameter name="duration" />
                {' '}
                seconds.
            </>,
            image: <ExampleIcon />,
        },
        divertScience: {
            name: 'Divert Science',
            description: <>
                Reduce science power by up to
                <Parameter name="maxAmount" />
                , increasing target system power by the same amount for
                <Parameter name="duration" />
                {' '}
                seconds.
            </>,
            image: <ExampleIcon />,
        },
        divertTactical: {
            name: 'Divert Tactical',
            description: <>
                Reduce tactical power by up to
                <Parameter name="maxAmount" />
                , increasing target system power by the same amount for
                <Parameter name="duration" />
                {' '}
                seconds.
            </>,
            image: <ExampleIcon />,
        },
        overcharge: {
            name: 'Overcharge',
            description: <>
                Target system gains
                <Parameter name="powerGain" />
                {' '}
                power for
                <Parameter name="duration" />
                {' '}
                seconds, but takes damage every second for the duration.
            </>,
            image: <ExampleIcon />,
        },
        shunt: {
            name: 'Shunt',
            description: 'Swap all status effects between a system and its horizontal neighbor, preserving cooldowns.',
            image: <ExampleIcon />,
        },
        generationPriority: {
            name: 'Generation Priority',
            description: <>
                For
                <Parameter name="duration" />
                {' '}
                seconds, the targeted system generates after any other system generates.
            </>,
            image: <ExampleIcon />,
        },
        scan: {
            name: 'Scan',
            description: <>
                Reveal info on the targeted system of an enemy ship, for
                {' '}
                <Parameter name="duration" />
                s.
            </>,
            image: <ExampleIcon />,
        },
        scanPulse: {
            name: 'Scan pulse (temp)',
            description: 'A temporary scan card with 1 deflector parameter.',
            image: <ExampleIcon />,
        },
        tetryonScan: {
            name: 'Tetryon Scan (temp)',
            description: 'A temporary scan card with 2 deflector parameters.',
            image: <ExampleIcon />,
        },
        phasedPolaronBeamScan: {
            name: 'Phased Polaron Beam Scan (temp)',
            description: 'A temporary scan card with 3 deflector parameters.',
            image: <ExampleIcon />,
        },
        deflectorPhasedAntiprotonBeam: {
            name: 'Phased Antiproton Beam',
            description: <>
                <Trait type="expendable" />
                Emits a long range beam of phased antiprotons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedAntiprotonPulse: {
            name: 'Phased Antiproton Pulse',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a pulse of phased antiprotons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedAntiprotonBurst: {
            name: 'Phased Antiproton Burst',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a burst of phased antiprotons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedAntiprotonWave: {
            name: 'Phased Antiproton Wave',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a wave of phased antiprotons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedTetryonBeam: {
            name: 'Phased Tetryon Beam',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a long range beam of phased tetryons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedTetryonPulse: {
            name: 'Phased Tetryon Pulse',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a pulse of phased tetryons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedTetryonBurst: {
            name: 'Phased Tetryon Burst',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a burst of phased tetryons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedTetryonWave: {
            name: 'Phased Tetryon Wave',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a wave of phased tetryons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedChronitonBeam: {
            name: 'Phased Chroniton Beam',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a long range beam of phased chronitons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedChronitonPulse: {
            name: 'Phased Chroniton Pulse',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a pulse of phased chronitons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedChronitonBurst: {
            name: 'Phased Chroniton Burst',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a burst of phased chronitons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedChronitonWave: {
            name: 'Phased Chroniton Wave',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a wave of phased chronitons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedGravitonBeam: {
            name: 'Phased Graviton Beam',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a long range beam of phased gravitons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedGravitonPulse: {
            name: 'Phased Graviton Pulse',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a pulse of phased gravitons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedGravitonBurst: {
            name: 'Phased Graviton Burst',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a burst of phased gravitons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedGravitonWave: {
            name: 'Phased Graviton Wave',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a wave of phased gravitons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedPolaronBeam: {
            name: 'Phased Polaron Beam',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a long range beam of phased polarons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedPolaronPulse: {
            name: 'Phased Polaron Pulse',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a pulse of phased polarons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedPolaronBurst: {
            name: 'Phased Polaron Burst',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a burst of phased polarons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorPhasedPolaronWave: {
            name: 'Phased Polaron Wave',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a wave of phased polarons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentAntiprotonBeam: {
            name: 'Coherent Antiproton Beam',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a long range beam of coherent antiprotons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentAntiprotonPulse: {
            name: 'Coherent Antiproton Pulse',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a pulse of coherent antiprotons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentAntiprotonBurst: {
            name: 'Coherent Antiproton Burst',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a burst of coherent antiprotons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentAntiprotonWave: {
            name: 'Coherent Antiproton Wave',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a wave of coherent antiprotons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentTetryonBeam: {
            name: 'Coherent Tetryon Beam',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a long range beam of coherent tetryons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentTetryonPulse: {
            name: 'Coherent Tetryon Pulse',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a pulse of coherent tetryons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentTetryonBurst: {
            name: 'Coherent Tetryon Burst',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a burst of coherent tetryons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentTetryonWave: {
            name: 'Coherent Tetryon Wave',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a wave of coherent tetryons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentChronitonBeam: {
            name: 'Coherent Chroniton Beam',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a long range beam of coherent chronitons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentChronitonPulse: {
            name: 'Coherent Chroniton Pulse',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a pulse of coherent chronitons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentChronitonBurst: {
            name: 'Coherent Chroniton Burst',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a burst of coherent chronitons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentChronitonWave: {
            name: 'Coherent Chroniton Wave',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a wave of coherent chronitons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentGravitonBeam: {
            name: 'Coherent Graviton Beam',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a long range beam of coherent gravitons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentGravitonPulse: {
            name: 'Coherent Graviton Pulse',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a pulse of coherent gravitons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentGravitonBurst: {
            name: 'Coherent Graviton Burst',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a burst of coherent gravitons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentGravitonWave: {
            name: 'Coherent Graviton Wave',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a wave of coherent gravitons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentPolaronBeam: {
            name: 'Coherent Polaron Beam',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a long range beam of coherent polarons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentPolaronPulse: {
            name: 'Coherent Polaron Pulse',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a pulse of coherent polarons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentPolaronBurst: {
            name: 'Coherent Polaron Burst',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a burst of coherent polarons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorCoherentPolaronWave: {
            name: 'Coherent Polaron Wave',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a wave of coherent polarons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedAntiprotonBeam: {
            name: 'Inverted Antiproton Beam',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a long range beam of inverted antiprotons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedAntiprotonPulse: {
            name: 'Inverted Antiproton Pulse',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a pulse of inverted antiprotons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedAntiprotonBurst: {
            name: 'Inverted Antiproton Burst',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a burst of inverted antiprotons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedAntiprotonWave: {
            name: 'Inverted Antiproton Wave',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a wave of inverted antiprotons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedTetryonBeam: {
            name: 'Inverted Tetryon Beam',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a long range beam of inverted tetryons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedTetryonPulse: {
            name: 'Inverted Tetryon Pulse',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a pulse of inverted tetryons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedTetryonBurst: {
            name: 'Inverted Tetryon Burst',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a burst of inverted tetryons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedTetryonWave: {
            name: 'Inverted Tetryon Wave',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a wave of inverted tetryons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedChronitonBeam: {
            name: 'Inverted Chroniton Beam',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a long range beam of inverted chronitons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedChronitonPulse: {
            name: 'Inverted Chroniton Pulse',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a pulse of inverted chronitons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedChronitonBurst: {
            name: 'Inverted Chroniton Burst',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a burst of inverted chronitons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedChronitonWave: {
            name: 'Inverted Chroniton Wave',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a wave of inverted chronitons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedGravitonBeam: {
            name: 'Inverted Graviton Beam',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a long range beam of inverted gravitons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedGravitonPulse: {
            name: 'Inverted Graviton Pulse',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a pulse of inverted gravitons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedGravitonBurst: {
            name: 'Inverted Graviton Burst',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a burst of inverted gravitons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedGravitonWave: {
            name: 'Inverted Graviton Wave',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a wave of inverted gravitons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedPolaronBeam: {
            name: 'Inverted Polaron Beam',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a long range beam of inverted polarons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedPolaronPulse: {
            name: 'Inverted Polaron Pulse',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a pulse of inverted polarons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedPolaronBurst: {
            name: 'Inverted Polaron Burst',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a burst of inverted polarons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorInvertedPolaronWave: {
            name: 'Inverted Polaron Wave',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a wave of inverted polarons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedAntiprotonBeam: {
            name: 'Modulated Antiproton Beam',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a long range beam of modulated antiprotons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedAntiprotonPulse: {
            name: 'Modulated Antiproton Pulse',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a pulse of modulated antiprotons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedAntiprotonBurst: {
            name: 'Modulated Antiproton Burst',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a burst of modulated antiprotons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedAntiprotonWave: {
            name: 'Modulated Antiproton Wave',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a wave of modulated antiprotons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedTetryonBeam: {
            name: 'Modulated Tetryon Beam',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a long range beam of modulated tetryons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedTetryonPulse: {
            name: 'Modulated Tetryon Pulse',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a pulse of modulated tetryons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedTetryonBurst: {
            name: 'Modulated Tetryon Burst',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a burst of modulated tetryons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedTetryonWave: {
            name: 'Modulated Tetryon Wave',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a wave of modulated tetryons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedChronitonBeam: {
            name: 'Modulated Chroniton Beam',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a long range beam of modulated chronitons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedChronitonPulse: {
            name: 'Modulated Chroniton Pulse',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a pulse of modulated chronitons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedChronitonBurst: {
            name: 'Modulated Chroniton Burst',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a burst of modulated chronitons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedChronitonWave: {
            name: 'Modulated Chroniton Wave',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a wave of modulated chronitons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedGravitonBeam: {
            name: 'Modulated Graviton Beam',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a long range beam of modulated gravitons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedGravitonPulse: {
            name: 'Modulated Graviton Pulse',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a pulse of modulated gravitons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedGravitonBurst: {
            name: 'Modulated Graviton Burst',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a burst of modulated gravitons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedGravitonWave: {
            name: 'Modulated Graviton Wave',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a wave of modulated gravitons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedPolaronBeam: {
            name: 'Modulated Polaron Beam',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a long range beam of modulated polarons in a straight line.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedPolaronPulse: {
            name: 'Modulated Polaron Pulse',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a pulse of modulated polarons in a wide spread.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedPolaronBurst: {
            name: 'Modulated Polaron Burst',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a burst of modulated polarons in all directions that also affects your ship.
            </>,
            image: <ExampleIcon />,
        },
        deflectorModulatedPolaronWave: {
            name: 'Modulated Polaron Wave',
            description: <>
                <Trait type="expendable" />
                {' '}
                Emits a wave of modulated polarons in a narrow spread.
            </>,
            image: <ExampleIcon />,
        },
    };

    const uiCardDefinitions = Object.entries(cardDescriptions)
        .reduce((acc, [type, desc]) => {
            acc[type as CardType] = { ...cardDefinitions[type as CardType], ...desc };
            return acc;
        }, {} as Record<CardType, UICardDefinition>);
    return uiCardDefinitions;
}

const uiCardDefinitions = loadCardDefinitions();

export const getCardDefinition = (type: CardType): UICardDefinition => {
    const cardDef: UICardDefinition = uiCardDefinitions[type];

    if (!cardDef) {
        throw new Error(`Card definition not found: ${type}`);
    }

    return cardDef;
};

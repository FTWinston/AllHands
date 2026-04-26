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
            description: 'A standard phaser cannon effective against light to medium targets.',
            image: <ExampleIcon />,
        },
        phaserStrip: {
            name: 'Phaser Strip',
            description: 'A wide-area phaser strip that can hit multiple targets in a line.',
            image: <ExampleIcon />,
        },
        photonTorpedo: {
            name: 'Photon Torpedo',
            description: 'A high-yield photon torpedo effective against heavily armored targets.',
            image: <ExampleIcon />,
        },
        photonicCannon: {
            name: 'Photonic Cannon',
            description: 'An advanced energy weapon that delivers devastating photonic blasts.',
            image: <ExampleIcon />,
        },

        exampleWeaponTarget: {
            name: 'Some Card with a longer title',
            description: 'A card that has a particular effect, for a particular crew role.',
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
        divertSensors: {
            name: 'Divert Sensors',
            description: <>
                Reduce sensors power by up to
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

import { CardType, cardDefinitions } from 'common-types';
import { default as ExampleIcon } from '../../../icons/exampleIcon.svg?react';
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
        exampleWeaponSlotTarget: {
            name: 'Example Weapon Slot Target',
            description: 'An example card that targets a specific weapon slot.',
            image: <ExampleIcon />,
        },
        exampleEnemyTarget: {
            name: 'Example Enemy Target',
            description: 'An example card that targets an enemy.',
            image: <ExampleIcon />,
        },
        exampleSystemTarget: {
            name: 'Some Card',
            description: 'A card that has a particular effect, for a particular crew role.',
            image: <ExampleIcon />,
        },
        exampleLocationTarget: {
            name: 'Some Card',
            description: 'A card that has a particular effect, for a particular crew role. Extra line!',
            descriptionLineHeight: 1.25,
            image: <ExampleIcon />,
        },
        exampleNoTarget: {
            name: 'Some Card with a title that\'s really quite long',
            nameFontSize: 0.88,
            description: 'A card that has a particular effect, for a particular crew role.',
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

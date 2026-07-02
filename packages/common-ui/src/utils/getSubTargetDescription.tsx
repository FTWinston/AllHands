import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { default as ExampleIcon } from '../icons/exampleIcon.svg?react';
import { SubTargetDescription } from '../types/SubTargetDescription';

const subTargetDescriptions: Record<ShipSystem, SubTargetDescription> = {
    hull: {
        name: 'Target hull',
        description: <>Focus damage on the target's hull.</>,
        image: <ExampleIcon />,
    },
    reactor: {
        name: 'Target reactor',
        description: <>Disrupt the target's reactor.</>,
        image: <ExampleIcon />,
    },
    helm: {
        name: 'Target helm',
        description: <>Disable the target's helm and reduce their maneuverability.</>,
        image: <ExampleIcon />,
    },
    science: {
        name: 'Target science',
        description: <>Disrupt the target's science systems.</>,
        image: <ExampleIcon />,
    },
    tactical: {
        name: 'Target tactical',
        description: <>Disable the target's tactical systems and reduce their firepower.</>,
        image: <ExampleIcon />,
    },
    engineer: {
        name: 'Target engineer',
        description: <>Damage the target's engineering systems.</>,
        image: <ExampleIcon />,
    },
};

export function getSubTargetDescription(subTarget: ShipSystem): SubTargetDescription {
    const description: SubTargetDescription = subTargetDescriptions[subTarget];

    if (!description) {
        throw new Error(`Sub-target description not found: ${subTarget}`);
    }

    return description;
};

import { ShipSetupInfo, NonCrewSystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';

const minimalSystemSetup: NonCrewSystemSetupInfo = {
    cards: ['exampleNoTarget'],
    maxPowerLevel: 5,
    initialHandSize: 0,
};

/** A minimal, valid ship setup for tests. Spread and override per test. */
export function shipSetup(faction: string | undefined, x = 0, y = 0): ShipSetupInfo {
    return {
        name: 'Test',
        appearance: 'chevron',
        faction,
        position: { x, y, angle: 0 },
        hull: { ...minimalSystemSetup },
        reactor: { ...minimalSystemSetup, cards: ['reactorPowerHull', 'reactorPowerReactor', 'reactorPowerHelm', 'reactorPowerScience', 'reactorPowerTactical', 'reactorPowerEngineer', 'reactorPowerHull', 'reactorPowerReactor', 'reactorPowerHelm', 'reactorPowerScience', 'reactorPowerTactical', 'reactorPowerEngineer'] },
        helm: { ...minimalSystemSetup },
        science: { ...minimalSystemSetup },
        tactical: { ...minimalSystemSetup, numSlots: 1 },
        engineer: { ...minimalSystemSetup },
    };
}

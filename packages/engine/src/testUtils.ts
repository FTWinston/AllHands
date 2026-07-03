import { CrewSystemSetupInfo, ShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';

const minimalCrewSetup: CrewSystemSetupInfo = {
    cards: ['exampleNoTarget'],
    initialPowerLevel: 3,
    maxPowerLevel: 5,
    initialHandSize: 0,
    health: 100,
    maxHealth: 100,
};

/** A minimal, valid ship setup for tests. Spread and override per test. */
export function shipSetup(faction: string | undefined, x = 0, y = 0): ShipSetupInfo {
    return {
        name: 'Test',
        appearance: 'chevron',
        faction,
        position: { x, y, angle: 0 },
        hull: { initialPowerLevel: 3, maxPowerLevel: 5, health: 100, maxHealth: 100 },
        reactor: { initialPowerLevel: 3, maxPowerLevel: 5, health: 100, maxHealth: 100 },
        helm: { ...minimalCrewSetup },
        science: { ...minimalCrewSetup },
        tactical: { ...minimalCrewSetup, numSlots: 1 },
        engineer: { ...minimalCrewSetup },
    };
}

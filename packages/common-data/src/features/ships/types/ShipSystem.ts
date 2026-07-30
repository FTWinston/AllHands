import { CrewRoleName } from './CrewRole';

export type ShipSystem = 'hull' | 'reactor' | CrewRoleName;

export const shipSystems: ShipSystem[] = [
    'hull',
    'reactor',
    'helm',
    'science',
    'tactical',
    'engineer',
];

export const helmSystem = shipSystems.indexOf('helm');
export const scienceSystem = shipSystems.indexOf('science');
export const tacticalSystem = shipSystems.indexOf('tactical');
export const engineerSystem = shipSystems.indexOf('engineer');

export const isSystem = (system: string): system is ShipSystem => {
    if (shipSystems.includes(system as ShipSystem)) {
        return true;
    }

    throw new Error(`Invalid system: ${system}`);
};

export const isCrewSystem = (system: string): system is CrewRoleName => {
    if (shipSystems.indexOf(system as ShipSystem) > 1) {
        return true;
    }

    throw new Error(`Invalid crew system: ${system}`);
};

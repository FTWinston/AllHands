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

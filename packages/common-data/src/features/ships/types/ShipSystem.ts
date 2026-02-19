import { CrewRoleName } from './CrewRole';

export type ShipSystem = 'hull' | 'reactor' | CrewRoleName;

export const shipSystems: ShipSystem[] = [
    'hull',
    'reactor',
    'helm',
    'sensors',
    'tactical',
    'engineer',
];

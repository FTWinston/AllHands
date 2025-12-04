import { CrewRoleName } from './CrewRole';

export type ShipSystem = 'hull' | 'shields' | CrewRoleName;

export const shipSystems: ShipSystem[] = [
    'hull',
    'shields',
    'helm',
    'sensors',
    'tactical',
    'engineer',
];

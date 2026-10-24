import type { ShipInfo } from '../../space/types/GameObjectInfo';
import type { StationDepartureStatus } from '../types/StationDepartureStatus';

/** What the given ship's crew must still do before helm can warp away from the station it's docked at. Only meaningful at a station. */
export function getStationDepartureStatus(ship: Pick<ShipInfo, 'helmState' | 'scienceState' | 'tacticalState' | 'engineerState'>): StationDepartureStatus {
    const crewSystems = [ship.helmState, ship.scienceState, ship.tacticalState, ship.engineerState];

    return crewSystems.some(system => system.shopOpen) ? 'shopping' : 'ready';
}

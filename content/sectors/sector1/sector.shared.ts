import { deadWeightShared } from './deadWeight/deadWeight.shared';
import { feverShipShared } from './feverShip/feverShip.shared';
import { lastShuttleOutShared } from './lastShuttleOut/lastShuttleOut.shared';
import { quarantineGateShared } from './quarantineGate/quarantineGate.shared';
import { quietRunningShared } from './quietRunning/quietRunning.shared';
import { slowBoatShared } from './slowBoat/slowBoat.shared';
import { standingOrdersShared } from './standingOrders/standingOrders.shared';

/** Everything sector 1's encounters add that the engine and the clients share. */
export const sector1SharedContent = [
    slowBoatShared,
    standingOrdersShared,
    feverShipShared,
    deadWeightShared,
    lastShuttleOutShared,
    quietRunningShared,
    quarantineGateShared,
] as const;

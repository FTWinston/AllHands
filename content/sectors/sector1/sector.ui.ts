import { deadWeightUi } from './deadWeight/deadWeight.ui';
import { feverShipUi } from './feverShip/feverShip.ui';
import { lastShuttleOutUi } from './lastShuttleOut/lastShuttleOut.ui';
import { quarantineGateUi } from './quarantineGate/quarantineGate.ui';
import { quietRunningUi } from './quietRunning/quietRunning.ui';
import { slowBoatUi } from './slowBoat/slowBoat.ui';
import { standingOrdersUi } from './standingOrders/standingOrders.ui';

/** Everything sector 1's encounters add to the clients. */
export const sector1UiContent = [
    slowBoatUi,
    standingOrdersUi,
    feverShipUi,
    deadWeightUi,
    lastShuttleOutUi,
    quietRunningUi,
    quarantineGateUi,
] as const;

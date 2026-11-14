import { quarantineGateShared } from './quarantineGate/quarantineGate.shared';
import { standingOrdersShared } from './standingOrders/standingOrders.shared';

/** Everything sector 1's encounters add that the engine and the clients share. */
export const sector1SharedContent = [
    standingOrdersShared,
    quarantineGateShared,
] as const;

import { quarantineGateUi } from './quarantineGate/quarantineGate.ui';
import { standingOrdersUi } from './standingOrders/standingOrders.ui';

/** Everything sector 1's encounters add to the clients. */
export const sector1UiContent = [
    standingOrdersUi,
    quarantineGateUi,
] as const;

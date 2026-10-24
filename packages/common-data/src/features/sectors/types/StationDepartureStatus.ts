/**
 * What a player ship's crew must still do before leaving a station. In order:
 * - `shopping`: the shopping crew member (see `getShopRole`) must close their shop, which gives helm the Warp Away card;
 * - `helmDeckView`: helm must close their deck view, which covers their hand;
 * - `ready`: helm can play Warp Away.
 */
export type StationDepartureStatus = 'shopping' | 'helmDeckView' | 'ready';

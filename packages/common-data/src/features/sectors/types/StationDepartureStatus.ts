/**
 * What a player ship's crew must still do before leaving a station:
 * - `shopping`: the shopping crew member (see `getShopRole`) must close their shop, which gives helm the Warp Away card;
 * - `ready`: helm can play Warp Away.
 */
export type StationDepartureStatus = 'shopping' | 'ready';

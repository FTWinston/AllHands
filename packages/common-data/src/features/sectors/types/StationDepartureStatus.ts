/**
 * What a player ship's crew must still do before leaving a station:
 * - `shopping`: the shopping crew member (see `getShopRole`) hasn't yet closed their shop, which gives helm the Warp Away card;
 * - `ready`: helm has been given Warp Away. Reopening the shop doesn't change this.
 */
export type StationDepartureStatus = 'shopping' | 'ready';

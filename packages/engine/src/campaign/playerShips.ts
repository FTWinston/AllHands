import { PlayerShip } from '../state/PlayerShip';
import type { GameState } from '../state/GameState';

export function getPlayerShips(state: GameState): PlayerShip[] {
    return [...state.objects.values()].filter((object): object is PlayerShip => object instanceof PlayerShip);
}

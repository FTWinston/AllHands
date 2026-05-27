import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { GameObject } from 'src/state/GameObject';
import { GameState } from 'src/state/GameState';
import { Ship } from 'src/state/Ship';

export function applyScanCard(
    _gameState: GameState,
    ship: Ship,
    target: GameObject | null,
    system: ShipSystem,
    _parameters: CardParameters
): boolean {
    if (!target || !('helmState' in target)) {
        console.warn('scan: target is not a ship');
        return false;
    }
    ship.scienceState.subscribeToSystem(target as Ship, system);
    return true;
}

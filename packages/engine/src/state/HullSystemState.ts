import { SystemSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { BindableEvent } from 'src/classes/BindableEvent';
import { GameState } from './GameState';
import { SystemState } from './SystemState';
import type { Ship } from './Ship';

export class HullSystemState extends SystemState {
    constructor(setup: SystemSetupInfo, gameState: GameState, ship: Ship) {
        super(setup, gameState, ship);
    }

    override generate = new BindableEvent<() => void>(() => {
        this.linkedEngineerSystemTile.adjustEffectLevel('shield', this.powerLevel);
    });
}

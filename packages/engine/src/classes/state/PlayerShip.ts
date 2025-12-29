import { entity, type, view } from '@colyseus/schema';
import { shipClientRole } from 'common-data/features/ships/types/CrewRole';
import { ShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { CrewState } from './CrewState';
import { GameState } from './GameState';
import { Ship } from './Ship';
import { ViewState } from './ViewState';

@entity
export class PlayerShip extends Ship {
    constructor(gameState: GameState, setup: ShipSetupInfo) {
        super(gameState, RelationshipType.Self, 'chevron', setup);
    }

    crew: CrewState | null = null;

    @view(shipClientRole) @type(ViewState) viewState: ViewState = new ViewState();
}

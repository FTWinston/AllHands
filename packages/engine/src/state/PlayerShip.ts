import { entity, type, view } from '@colyseus/schema';
import { ownShipClientRole } from 'common-data/features/ships/types/CrewRole';
import { PlayerShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { CrewState } from './CrewState';
import { GameObject } from './GameObject';
import { GameState } from './GameState';
import { Ship } from './Ship';
import { ViewState } from './systems/ViewState';

@entity
export class PlayerShip extends Ship {
    constructor(gameState: GameState, setup: PlayerShipSetupInfo) {
        super(gameState, {
            ...setup,
            appearance: 'chevron',
            relationship: RelationshipType.Self,
        });
    }

    crew: CrewState | null = null;

    @view(ownShipClientRole) @type(ViewState) readonly viewState: ViewState = new ViewState();

    protected addKnownObject(objectId: string, object: GameObject) {
        super.addKnownObject(objectId, object);

        this.crew?.addObjectToViews(object);
    }

    protected removeKnownObject(objectId: string, object: GameObject) {
        super.removeKnownObject(objectId, object);

        this.crew?.removeObjectFromViews(object);
    }

    destroy() {
        super.destroy();

        // TODO: do these actually want called? Are we better off leaving the crew assigned to the ship,
        // and letting them view the destroyed ship, then ending the game a short while after?
        this.crew?.unassignFromShip();
        this.crew?.setShip(null);
    }
}

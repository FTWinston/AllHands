import { entity, type, view } from '@colyseus/schema';
import { shipClientRole } from 'common-data/features/ships/types/CrewRole';
import { PlayerShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { CrewState } from './CrewState';
import { GameState } from './GameState';
import { MotionKeyframe } from './MotionKeyframe';
import { Ship } from './Ship';
import { ViewState } from './ViewState';

@entity
export class PlayerShip extends Ship {
    constructor(gameState: GameState, setup: PlayerShipSetupInfo) {
        super(gameState, {
            ...setup,
            appearance: 'chevron',
            relationship: RelationshipType.Self,
        });

        this.motion.push(new MotionKeyframe(
            gameState.clock.currentTime + 30000,
            setup.position.x + 5,
            setup.position.y + 2,
            Math.PI
        ));
    }

    crew: CrewState | null = null;

    @view(shipClientRole) @type(ViewState) readonly viewState: ViewState = new ViewState();
}

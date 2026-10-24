import { entity, type, view } from '@colyseus/schema';
import { StationDepartureStatus } from 'common-data/features/sectors/types/StationDepartureStatus';
import { ownEngineerClientRole, ownHelmClientRole, ownScienceClientRole, ownShipClientRole, ownTacticalClientRole } from 'common-data/features/ships/types/CrewRole';
import { ShipHit } from 'common-data/features/ships/types/ShipHit';
import { PlayerShipInfo, PlayerShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CrewState } from './CrewState';
import { GameObject } from './GameObject';
import { GameState } from './GameState';
import { Ship } from './Ship';
import { ViewState } from './systems/ViewState';

@entity
export class PlayerShip extends Ship implements PlayerShipInfo {
    constructor(gameState: GameState, setup: PlayerShipSetupInfo) {
        super(gameState, {
            ...setup,
            appearance: 'chevron',
            faction: gameState.playerFaction ?? undefined,
        });
    }

    crew: CrewState | null = null;

    @view(ownShipClientRole) @type(ViewState) readonly viewState: ViewState = new ViewState();

    /** Earned by completing encounters, and spent at stations. */
    @view(ownShipClientRole | ownHelmClientRole | ownScienceClientRole | ownTacticalClientRole | ownEngineerClientRole)
    @type('number') antimatter = 0;

    /** At a station, what the crew must still do before helm can warp away. Kept up to date by the campaign; cleared on leaving. */
    @view(ownShipClientRole | ownHelmClientRole | ownScienceClientRole | ownTacticalClientRole | ownEngineerClientRole)
    @type('string') stationDeparture: StationDepartureStatus | null = null;

    addAntimatter(amount: number) {
        if (amount > 0) {
            this.antimatter += amount;
        }
    }

    /** Spends the given amount of antimatter if the ship has that much, returning whether it did. */
    trySpendAntimatter(amount: number): boolean {
        if (amount < 0 || amount > this.antimatter) {
            return false;
        }

        this.antimatter -= amount;
        return true;
    }

    override cleanupAfterEncounter() {
        this.stationDeparture = null;
        super.cleanupAfterEncounter();
    }

    protected addKnownObject(objectId: string, object: GameObject) {
        super.addKnownObject(objectId, object);

        this.crew?.addObjectToViews(object);
    }

    protected removeObjectVisibility(objectId: string, object: GameObject) {
        super.removeObjectVisibility(objectId, object);

        this.crew?.removeObjectFromViews(object);
    }

    protected override wasHit(hit: ShipHit) {
        this.crew?.sendShipHit(hit);
    }

    destroy() {
        super.destroy();

        // TODO: do these actually want called? Are we better off leaving the crew assigned to the ship,
        // and letting them view the destroyed ship, then ending the game a short while after?
        this.crew?.unassignFromShip();
        this.crew?.setShip(null);
    }
}

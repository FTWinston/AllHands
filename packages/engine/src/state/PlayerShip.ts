import { ArraySchema, entity, type, view } from '@colyseus/schema';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { isKnowableCardType } from 'common-data/features/cards/utils/getKnowableCardTypes';
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

        // The crew can look through their decks whenever they're not in an encounter, so every card they start with counts as seen.
        for (const system of [this.helmState, this.scienceState, this.tacticalState, this.engineerState]) {
            this.markCardTypesSeen(system.deck.map(card => card.type));
        }
    }

    crew: CrewState | null = null;

    public override tick(deltaTime: number, currentTime: number) {
        super.tick(deltaTime, currentTime);

        // Mirroring every system's cards for the engineer is done once per tick, rather than everywhere cards change.
        // AI ships have no engineer to see them, so don't bother.
        if (this.gameState.isSimulatingSystems) {
            this.engineerState.mirrorSystemCards();
        }
    }

    @view(ownShipClientRole) @type(ViewState) readonly viewState: ViewState = new ViewState();

    /** Earned by completing encounters, and spent at stations. */
    @view(ownShipClientRole | ownHelmClientRole | ownScienceClientRole | ownTacticalClientRole | ownEngineerClientRole)
    @type('number') antimatter = 0;

    /**
     * The non-expendable card types this ship's crew has seen this game, in the order they were first seen.
     * The game client adds these to its record of known cards, which persists across games.
     */
    @view(ownShipClientRole)
    @type(['string']) readonly seenCardTypes = new ArraySchema<CardType>();

    /**
     * Cards are seen when they're in a crew member's deck (including bought cards), drawn into their hand, or offered in their shop.
     * Anything else that shows cards to the crew (e.g. offering a choice of reward cards) should call this with the cards it shows.
     * Expendable and campaign cards are ignored.
     */
    override markCardTypesSeen(types: Iterable<CardType>) {
        for (const type of types) {
            if (isKnowableCardType(type) && !this.seenCardTypes.includes(type)) {
                this.seenCardTypes.push(type);
            }
        }
    }

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

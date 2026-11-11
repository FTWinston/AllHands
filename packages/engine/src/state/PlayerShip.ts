import { ArraySchema, entity, type, view } from '@colyseus/schema';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { isKnowableCardType } from 'common-data/features/cards/utils/getKnowableCardTypes';
import { ownEngineerClientRole, ownHelmClientRole, ownScienceClientRole, ownShipClientRole, ownTacticalClientRole } from 'common-data/features/ships/types/CrewRole';
import { ShipHit } from 'common-data/features/ships/types/ShipHit';
import { PlayerShipInfo, PlayerShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { CommsState } from './CommsState';
import { CrewState } from './CrewState';
import { GameObject } from './GameObject';
import { GameState } from './GameState';
import { Ship } from './Ship';
import { ViewState } from './systems/ViewState';

@entity
export class PlayerShip extends Ship implements PlayerShipInfo {
    /** `knownCardTypes` are those the crew has seen in earlier games (see `seenCardTypes`), which count as seen from the start. */
    constructor(gameState: GameState, setup: PlayerShipSetupInfo, knownCardTypes: Iterable<CardType> = []) {
        super(gameState, {
            ...setup,
            appearance: 'chevron',
            faction: gameState.playerFaction ?? undefined,
        });

        this.markCardTypesSeen(knownCardTypes);

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

    /** What's coming in over comms that the crew has to deal with. Only the viewscreen and tactical are sent it. */
    @view(ownShipClientRole | ownTacticalClientRole) @type(CommsState) readonly comms = new CommsState();

    /** Earned by completing encounters, and spent at stations. */
    @view(ownShipClientRole | ownHelmClientRole | ownScienceClientRole | ownTacticalClientRole | ownEngineerClientRole)
    @type('number') antimatter = 0;

    /** How many work orders this ship's crew has placed this game. Each one raises the price of the next (see `getOrderPrice`). */
    @view(ownShipClientRole | ownHelmClientRole | ownScienceClientRole | ownTacticalClientRole | ownEngineerClientRole)
    @type('number') ordersPlaced = 0;

    /**
     * The non-expendable card types this ship's crew has seen, in the order they were first seen.
     * This starts with the cards its game client already knew from earlier games, and that client adds any new ones to its record of known cards.
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
}

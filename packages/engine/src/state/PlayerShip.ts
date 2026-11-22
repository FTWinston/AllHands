import { ArraySchema, MapSchema, entity, type, view } from '@colyseus/schema';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { isKnowableCardType } from 'common-data/features/cards/utils/getKnowableCardTypes';
import { crewRoleNames, type CrewRoleName, ownEngineerClientRole, ownHelmClientRole, ownScienceClientRole, ownShipClientRole, ownTacticalClientRole } from 'common-data/features/ships/types/CrewRole';
import { ShipHit } from 'common-data/features/ships/types/ShipHit';
import { PlayerShipInfo, PlayerShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getContactLabel } from 'src/utils/contactLabels';
import { OutfitBundleState, SalvageCardState } from './CardRewardState';
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

        this.tacticalTargetId = this.tacticalState.selectedTargetId;
        this.scienceTargetId = this.scienceState.scannedShipId ?? '';

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

    /** Cards salvaged after a successful fight, one for each crew member but `salvageChooser`, until one is taken or they're scrapped. */
    @view(ownShipClientRole | ownHelmClientRole | ownScienceClientRole | ownTacticalClientRole | ownEngineerClientRole)
    @type([SalvageCardState]) readonly salvage = new ArraySchema<SalvageCardState>();

    /** The crew member who chooses which salvaged card the ship takes, while there's salvage: whoever received the previous salvage. Otherwise empty. */
    @view(ownShipClientRole | ownHelmClientRole | ownScienceClientRole | ownTacticalClientRole | ownEngineerClientRole)
    @type('string') salvageChooser: CrewRoleName | '' = '';

    /** The crew member who received the last salvaged card, who chooses the next salvage. Null until the first salvage is taken. */
    lastSalvageRecipient: CrewRoleName | null = null;

    /** Bundles offered at an outfitting station after the first sector, until the crew agree on one. */
    @view(ownShipClientRole | ownHelmClientRole | ownScienceClientRole | ownTacticalClientRole | ownEngineerClientRole)
    @type([OutfitBundleState]) readonly outfitBundles = new ArraySchema<OutfitBundleState>();

    /** The index into `outfitBundles` that each crew member has voted for, keyed by role. */
    @view(ownShipClientRole | ownHelmClientRole | ownScienceClientRole | ownTacticalClientRole | ownEngineerClientRole)
    @type({ map: 'number' }) readonly bundleVotes = new MapSchema<number>();

    /** Whether the crew still has a salvage or outfitting choice to make. The ship can't leave until they've made it. */
    get hasUnsettledRewards(): boolean {
        return this.salvage.length > 0
            || this.outfitBundles.length > 0
            || crewRoleNames.some(role => this.getCrewSystem(role).outfitCards.length > 0);
    }

    /** Offers the given salvage, for the given crew member to choose from. */
    offerSalvage(chooser: CrewRoleName, cards: readonly SalvageCardState[]) {
        this.salvage.clear();
        this.salvage.push(...cards);
        this.salvageChooser = cards.length > 0 ? chooser : '';
        this.markCardTypesSeen(cards.map(offer => offer.card.type));
    }

    /** Withdraws any salvage on offer. */
    clearSalvage() {
        this.salvage.clear();
        this.salvageChooser = '';
    }

    /** Offers the given outfitting bundles, with no votes yet. */
    offerOutfitBundles(bundles: readonly OutfitBundleState[]) {
        this.clearOutfitBundles();
        this.outfitBundles.push(...bundles);
        this.markCardTypesSeen(bundles.flatMap(bundle => bundle.cards.map(offer => offer.card.type)));
    }

    /** Withdraws any outfitting bundles on offer, and their votes. */
    clearOutfitBundles() {
        this.outfitBundles.clear();
        this.bundleVotes.clear();
    }

    override cleanupAfterEncounter() {
        this.clearSalvage();
        this.clearOutfitBundles();
        super.cleanupAfterEncounter();
    }

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

    /**
     * A short, distinct name for each other object this ship has known of, by id, that its crew can shout across the bridge (see `getContactLabel`).
     * An object keeps its label for as long as it's in the game, even if it goes out of range and comes back, and another ship's crew may label it differently.
     */
    @view(ownShipClientRole | ownHelmClientRole | ownScienceClientRole | ownTacticalClientRole)
    @type({ map: 'string' }) readonly contactLabels = new MapSchema<string>();

    /** The id of the object that tactical is aiming at, or empty if none. Copied from the tactical system, so that helm's client can show it too. */
    @view(ownShipClientRole | ownHelmClientRole)
    @type('string') tacticalTargetId = '';

    /** The id of the ship that science is scanning, or empty if none. Copied from the science system, so that helm's client can show it too. */
    @view(ownShipClientRole | ownHelmClientRole)
    @type('string') scienceTargetId = '';

    /** Give a contact the first label that no other contact has, if it has none. Returns false for this ship itself, which has no label. */
    private labelContact(objectId: string): boolean {
        if (objectId === this.id) {
            return false;
        }

        if (!this.contactLabels.has(objectId)) {
            const inUse = new Set(this.contactLabels.values());
            let index = 0;
            while (inUse.has(getContactLabel(index))) {
                index++;
            }
            this.contactLabels.set(objectId, getContactLabel(index));
        }

        return true;
    }

    override updateKnownObjects(currentTime: number) {
        super.updateKnownObjects(currentTime);

        // A contact that left the game while out of range was never known to leave, so its label is still held. Free it for the next contact.
        for (const objectId of [...this.contactLabels.keys()]) {
            if (!this.gameState.objects.has(objectId)) {
                this.contactLabels.delete(objectId);
            }
        }
    }

    protected override contactForgotten(objectId: string) {
        this.contactLabels.delete(objectId);
    }

    protected addKnownObject(objectId: string, object: GameObject) {
        super.addKnownObject(objectId, object);
        this.labelContact(objectId);

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

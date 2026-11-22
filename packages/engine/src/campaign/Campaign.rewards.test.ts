import { bundleVotesNeeded, outfitBundleCount, outfitPickCount } from 'common-data/features/cards/utils/cardRewardCounts';
import { getCardRarity } from 'common-data/features/cards/utils/getCardRarity';
import { crewRoleNames } from 'common-data/features/ships/types/CrewRole';
import { cardSellPrice } from 'common-data/features/ships/utils/antimatter';
import { CardState } from 'src/state/CardState';
import { leaveSectorStart, seededRandom, settleRewards, setupGameRoom, startCampaign } from 'src/testUtils';
import { getHostileShips } from 'src/utils/shipQueries';
import { describe, expect, it } from 'vitest';
import { playerShipSetup } from './playerShipSetup';
import type { GameState } from 'src/state/GameState';
import type { PlayerShip } from 'src/state/PlayerShip';

const rooms = setupGameRoom();

function createCampaign(shipCount = 1, seed = 11) {
    const state = rooms.createState(seededRandom(seed));
    return { state, ...startCampaign(state, shipCount) };
}

function hasWarpCard(ship: PlayerShip) {
    return ship.helmState.hand.some(card => card.type === 'warpAway');
}

/** Loads a skirmish from the map, and destroys every hostile to meet its objective. */
function winSkirmish(state: GameState) {
    expect(state.campaign!.devLoadEncounter('skirmish')).toBe(true);
    for (const hostile of getHostileShips(state)) {
        hostile.destroy();
    }
    expect(state.encounter!.outcome).toBe('success');
}

/** Fills a crew member's deck up to its cap with copies of its first card. */
function fillDeck(ship: PlayerShip, role: 'helm' | 'tactical' = 'tactical') {
    const system = ship.getCrewSystem(role);
    while (!system.isDeckFull) {
        system.gainCard(new CardState(ship.getCardId(), system.deck[0].type));
    }
    return system;
}

describe('Deck cap', () => {
    it('caps each of the starter ship\'s crew decks at 12 cards', () => {
        const { ships: [ship] } = createCampaign();

        for (const role of crewRoleNames) {
            expect(ship.getCrewSystem(role).maxDeckSize).toBe(12);
            expect(playerShipSetup[role].maxDeckSize).toBe(12);
        }
    });

    it('adds a gained card to the deck until it\'s full, then holds it until the crew member makes room', () => {
        const { ships: [ship] } = createCampaign();
        const tactical = fillDeck(ship);
        expect(tactical.deck.length).toBe(12);
        expect(tactical.maxHealth).toBe(12);

        const extra = new CardState(ship.getCardId(), 'phaserCannon');
        tactical.gainCard(extra);

        expect(tactical.deck.length).toBe(12);
        expect([...tactical.incomingCards]).toEqual([extra]);
    });

    it('replaces a deck card with the first incoming card outside an encounter, selling the replaced card', () => {
        const { state, campaign, ships: [ship] } = createCampaign();
        leaveSectorStart(state);
        const tactical = fillDeck(ship);
        const extra = new CardState(ship.getCardId(), 'phaserCannon');
        tactical.gainCard(extra);
        const replaced = tactical.deck[2];
        const antimatter = ship.antimatter;

        expect(campaign.replaceDeckCard(ship, tactical, replaced.id)).toBe(true);

        expect(tactical.deck.includes(replaced)).toBe(false);
        expect(tactical.deck.at(-1)).toBe(extra);
        expect(tactical.deck.length).toBe(12);
        expect(tactical.incomingCards.length).toBe(0);
        expect(ship.antimatter).toBe(antimatter + cardSellPrice);

        // Nothing is waiting any more.
        expect(campaign.replaceDeckCard(ship, tactical, tactical.deck[0].id)).toBe(false);
    });

    it('discards the first incoming card instead, selling it', () => {
        const { state, campaign, ships: [ship] } = createCampaign();
        leaveSectorStart(state);
        const tactical = fillDeck(ship);
        tactical.gainCard(new CardState(ship.getCardId(), 'phaserCannon'));
        const antimatter = ship.antimatter;

        expect(campaign.discardIncomingCard(ship, tactical)).toBe(true);
        expect(tactical.incomingCards.length).toBe(0);
        expect(tactical.deck.length).toBe(12);
        expect(ship.antimatter).toBe(antimatter + cardSellPrice);

        expect(campaign.discardIncomingCard(ship, tactical)).toBe(false);
    });

    it('only lets incoming cards be dealt with outside an encounter', () => {
        const { state, campaign, ships: [ship] } = createCampaign();
        campaign.dismissMessage();
        winSkirmish(state);
        const helm = ship.helmState;
        fillDeck(ship, 'helm');
        helm.gainCard(new CardState(ship.getCardId(), 'burn'));

        expect(campaign.replaceDeckCard(ship, helm, helm.deck[0].id)).toBe(false);
        expect(campaign.discardIncomingCard(ship, helm)).toBe(false);
        expect(helm.incomingCards.length).toBe(1);
    });

    it('fills the space left by selling a card with the first incoming card', () => {
        const { state, campaign, ships: [ship] } = createCampaign();
        campaign.dismissMessage();
        expect(campaign.devLoadEncounter('repairStation')).toBe(true);
        const tactical = fillDeck(ship);
        const extra = new CardState(ship.getCardId(), 'phaserCannon');
        tactical.gainCard(extra);

        expect(campaign.sellDeckCard(ship, tactical, tactical.deck[0].id)).toBe(true);
        expect(tactical.deck.at(-1)).toBe(extra);
        expect(tactical.incomingCards.length).toBe(0);
        expect(state.campaign!.isAtStation).toBe(true);
    });

    it('holds a card bought at a shop while the deck is full', () => {
        const { campaign, ships: [ship] } = createCampaign();
        campaign.dismissMessage();
        expect(campaign.devLoadEncounter('armsDealer')).toBe(true);
        ship.addAntimatter(500);
        const tactical = fillDeck(ship);
        const bought = tactical.shopCards[0];

        expect(campaign.buyShopCard(ship, tactical, bought.id)).toBe(true);
        expect(tactical.deck.includes(bought)).toBe(false);
        expect([...tactical.incomingCards]).toEqual([bought]);
    });
});

describe('Salvage', () => {
    it('offers a card for each crew member but the chooser after a successful fight, holding back Warp Away until it\'s settled', () => {
        const { state, campaign, ships: [ship] } = createCampaign();
        campaign.dismissMessage();
        winSkirmish(state);

        const chooser = ship.salvageChooser;
        expect(chooser).not.toBe('');
        expect(ship.salvage.map(offer => offer.role).sort()).toEqual(crewRoleNames.filter(role => role !== chooser).sort());

        for (const offer of ship.salvage) {
            const system = ship.getCrewSystem(offer.role);
            expect(offer.deckSize).toBe(system.maxHealth);
            expect(offer.maxDeckSize).toBe(system.maxDeckSize);
            expect(ship.seenCardTypes).toContain(offer.card.type);
        }

        expect(hasWarpCard(ship)).toBe(false);
        expect(campaign.warpAway(ship)).toBe(false);
    });

    it('lets only the chooser take a card, which goes to its crew member, who chooses the next salvage', () => {
        const { state, campaign, ships: [ship] } = createCampaign();
        campaign.dismissMessage();
        winSkirmish(state);

        const chooser = ship.salvageChooser;
        const offer = ship.salvage[0];
        const { role, card } = offer;
        const other = crewRoleNames.find(candidate => candidate !== chooser)!;
        const deckSize = ship.getCrewSystem(role).deck.length;

        expect(campaign.takeSalvage(ship, other, card.id)).toBe(false);
        expect(campaign.takeSalvage(ship, chooser as never, 9999)).toBe(false);
        expect(campaign.takeSalvage(ship, chooser as never, card.id)).toBe(true);

        expect(ship.salvage.length).toBe(0);
        expect(ship.salvageChooser).toBe('');
        const system = ship.getCrewSystem(role);
        expect(system.deck.length).toBe(deckSize + 1);
        expect(system.deck.at(-1)!.type).toBe(card.type);
        expect(hasWarpCard(ship)).toBe(true);

        // The recipient chooses the next salvage, and so can't benefit from it.
        expect(campaign.warpAway(ship)).toBe(true);
        winSkirmish(state);
        expect(ship.salvageChooser).toBe(role);
        expect(ship.salvage.some(next => next.role === role)).toBe(false);
    });

    it('scraps all of it for the price of one card, and the same crew member chooses next time', () => {
        const { state, campaign, ships: [ship] } = createCampaign();
        campaign.dismissMessage();
        winSkirmish(state);

        const chooser = ship.salvageChooser as typeof crewRoleNames[number];
        const antimatter = ship.antimatter;
        const other = crewRoleNames.find(candidate => candidate !== chooser)!;

        expect(campaign.scrapSalvage(ship, other)).toBe(false);
        expect(campaign.scrapSalvage(ship, chooser)).toBe(true);
        expect(ship.salvage.length).toBe(0);
        expect(ship.antimatter).toBe(antimatter + cardSellPrice);
        expect(hasWarpCard(ship)).toBe(true);
        expect(campaign.scrapSalvage(ship, chooser)).toBe(false);

        campaign.warpAway(ship);
        winSkirmish(state);
        expect(ship.salvageChooser).toBe(chooser);
    });

    it('offers nothing for stations and bosses', () => {
        const { state, campaign, ships: [ship] } = createCampaign();
        campaign.dismissMessage();

        expect(campaign.devLoadEncounter('repairStation')).toBe(true);
        expect(ship.salvage.length).toBe(0);
        expect(hasWarpCard(ship)).toBe(true);

        expect(campaign.devLoadEncounter('bossA')).toBe(true);
        state.getObjectByScenarioId('boss')!.destroy();
        expect(state.encounter!.outcome).toBe('success');
        expect(ship.salvage.length).toBe(0);
        expect(hasWarpCard(ship)).toBe(true);
    });

    it('withdraws salvage that wasn\'t settled when the encounter is abandoned', () => {
        const { state, campaign, ships: [ship] } = createCampaign();
        campaign.dismissMessage();
        winSkirmish(state);
        expect(ship.salvage.length).toBeGreaterThan(0);

        expect(campaign.devLoadEncounter('repairStation')).toBe(true);
        expect(ship.salvage.length).toBe(0);
        expect(ship.salvageChooser).toBe('');
    });
});

describe('Outfitting', () => {
    it('docks at the outfitting station after the first sector intro, where each crew member picks a card for themselves', () => {
        const { state, campaign, ships: [ship] } = createCampaign();
        campaign.dismissMessage();

        expect(state.encounterKind).toBe('outfitting');
        expect(ship.outfitBundles.length).toBe(0);

        for (const role of crewRoleNames) {
            const system = ship.getCrewSystem(role);
            expect(system.outfitCards.length).toBe(outfitPickCount);
            expect(new Set(system.outfitCards.map(card => card.type)).size).toBe(outfitPickCount);
        }

        // Nobody can leave until everyone has picked.
        for (const role of crewRoleNames) {
            expect(hasWarpCard(ship)).toBe(false);
            const system = ship.getCrewSystem(role);
            const [picked] = system.outfitCards;
            const deckSize = system.deck.length;

            expect(campaign.takeOutfitCard(ship, system, 9999)).toBe(false);
            expect(campaign.takeOutfitCard(ship, system, picked.id)).toBe(true);
            expect(system.outfitCards.length).toBe(0);
            expect(system.deck.length).toBe(deckSize + 1);
            expect(system.deck.at(-1)).toBe(picked);
        }

        expect(hasWarpCard(ship)).toBe(true);
        expect(campaign.warpAway(ship)).toBe(true);
        expect(state.phase).toBe('map');
    });

    /** Plays through the first sector with dev auto win, settling every reward, then docks at the second sector's outfitting station. */
    function reachSecondSector() {
        const created = createCampaign();
        const { state, campaign, ships: [ship] } = created;
        state.devAutoWin = true;
        leaveSectorStart(state);

        while (state.phase === 'map') {
            campaign.selectRoute(ship, state.map!.availableNodeIds[0]);
            settleRewards(state);
            campaign.warpAway(ship);
        }

        expect(state.phase).toBe('sectorOutro');
        campaign.dismissMessage();
        campaign.dismissMessage();
        expect(state.map!.sectorIndex).toBe(1);
        expect(state.encounterKind).toBe('outfitting');
        return created;
    }

    it('offers bundles in later sectors, each with a card for every crew member and a standout for a different one', () => {
        const { ships: [ship] } = reachSecondSector();

        expect(ship.outfitBundles.length).toBe(outfitBundleCount);
        expect(new Set(ship.outfitBundles.map(bundle => bundle.standout)).size).toBe(outfitBundleCount);

        for (const bundle of ship.outfitBundles) {
            expect(bundle.cards.map(offer => offer.role)).toEqual([...crewRoleNames]);

            for (const offer of bundle.cards) {
                const rarity = getCardRarity(offer.card.type);
                if (offer.role === bundle.standout) {
                    expect(rarity).not.toBe('common');
                } else {
                    expect(rarity).toBe('common');
                }
            }
        }

        for (const role of crewRoleNames) {
            expect(ship.getCrewSystem(role).outfitCards.length).toBe(0);
            const offered = ship.outfitBundles.map(bundle => bundle.cards.find(offer => offer.role === role)!.card.type);
            expect(new Set(offered).size).toBe(offered.length);
        }

        expect(hasWarpCard(ship)).toBe(false);
    });

    it('gives each crew member their card from a bundle once enough of them vote for it', () => {
        const { campaign, ships: [ship] } = reachSecondSector();
        const chosen = ship.outfitBundles[1].cards.map(offer => ({ role: offer.role, type: offer.card.type }));
        // Some decks may be full by now, so their new card waits for room.
        const cardCount = (role: typeof crewRoleNames[number]) => ship.getCrewSystem(role).deck.length + ship.getCrewSystem(role).incomingCards.length;
        const newestCard = (role: typeof crewRoleNames[number]) => ship.getCrewSystem(role).incomingCards.at(-1) ?? ship.getCrewSystem(role).deck.at(-1);
        const cardCounts = crewRoleNames.map(cardCount);

        expect(campaign.voteBundle(ship, 'helm', 3)).toBe(false);
        expect(campaign.voteBundle(ship, 'helm', -1)).toBe(false);

        // Two votes aren't enough, and changing a vote moves it.
        expect(campaign.voteBundle(ship, 'helm', 1)).toBe(true);
        expect(campaign.voteBundle(ship, 'science', 0)).toBe(true);
        expect(campaign.voteBundle(ship, 'tactical', 1)).toBe(true);
        expect(ship.bundleVotes.get('science')).toBe(0);
        expect(ship.outfitBundles.length).toBe(outfitBundleCount);

        expect(bundleVotesNeeded).toBe(3);
        expect(campaign.voteBundle(ship, 'science', 1)).toBe(true);

        expect(ship.outfitBundles.length).toBe(0);
        expect(ship.bundleVotes.size).toBe(0);
        crewRoleNames.forEach((role, index) => {
            expect(cardCount(role)).toBe(cardCounts[index] + 1);
            expect(newestCard(role)!.type).toBe(chosen.find(offer => offer.role === role)!.type);
        });

        expect(hasWarpCard(ship)).toBe(true);
        expect(campaign.voteBundle(ship, 'engineer', 1)).toBe(false);
    });

    it('repairs the ship', () => {
        const { state, campaign, ships: [ship] } = createCampaign();
        ship.helmState.adjustHealth(-3);
        expect(ship.helmState.health).toBeLessThan(ship.helmState.maxHealth);

        campaign.dismissMessage();
        expect(state.encounterKind).toBe('outfitting');
        expect(ship.helmState.health).toBe(ship.helmState.maxHealth);
    });
});

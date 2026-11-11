import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { PlayerShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { setupGameRoom, shipSetup } from 'src/testUtils';
import { describe, expect, it } from 'vitest';
import { CardState } from '../CardState';
import { PlayerShip } from '../PlayerShip';

const rooms = setupGameRoom();

/** A ship whose engineer has nothing in hand or deck, and plenty of power. */
function createEngineer() {
    const gameState = rooms.createState();
    const baseSetup = shipSetup(undefined);
    const setup: PlayerShipSetupInfo = {
        ...baseSetup,
        engineer: { ...baseSetup.engineer, cards: [], initialHandSize: 0 },
    };
    const ship = new PlayerShip(gameState, setup);
    gameState.add(ship);

    const engineer = ship.engineerState;
    Object.assign(engineer, { powerLevel: 5 });

    /** Puts a card of the given type into the hand, with these extra traits. */
    const deal = (...traits: [Parameters<CardState['addTrait']>[0], ExtraTraitType][]) => {
        const card = new CardState(ship.getCardId(), 'exampleNoTarget');
        for (const [trait, type] of traits) {
            card.addTrait(trait, type);
        }
        engineer.addCardToHand(card);
        return card;
    };

    const play = (card: CardState) => engineer.playCard(card.id, card.type, 'no-target', '');

    return { engineer, deal, play };
}

describe('SystemState playing a card', () => {
    it('removes only the extra traits that are meant to go when it is played', () => {
        const { deal, play } = createEngineer();
        const card = deal(['unstable', ExtraTraitType.RemoveOnPlay], ['stabilised', ExtraTraitType.Normal], ['disrupting', ExtraTraitType.Negative]);

        expect(play(card)).not.toBeNull();

        expect([...card.extraTraits.keys()].sort()).toEqual(['disrupting', 'stabilised']);
    });

    it('returns a primary card to the hand, every time it is played', () => {
        const { engineer, deal, play } = createEngineer();
        const card = deal(['primary', ExtraTraitType.Normal]);

        for (let i = 0; i < 3; i++) {
            expect(play(card)).not.toBeNull();
            expect([...engineer.hand]).toEqual([card]);
        }

        expect(engineer.deck).toHaveLength(0);
    });

    it('sends a primary card to the deck if another copy of it is already in the hand', () => {
        const { engineer, deal, play } = createEngineer();
        const card = deal(['primary', ExtraTraitType.Normal]);
        const copy = deal(['primary', ExtraTraitType.Normal]);

        expect(play(card)).not.toBeNull();

        expect([...engineer.hand]).toEqual([copy]);
        expect([...engineer.deck]).toEqual([card]);
    });

    it('destroys a primary, expendable card that has another copy in the hand, as it can\'t go to the deck', () => {
        const { engineer, deal, play } = createEngineer();
        const card = deal(['primary', ExtraTraitType.Normal], ['expendable', ExtraTraitType.Normal]);
        const copy = deal(['primary', ExtraTraitType.Normal]);

        expect(play(card)).not.toBeNull();

        expect([...engineer.hand]).toEqual([copy]);
        expect(engineer.deck).toHaveLength(0);
    });
});

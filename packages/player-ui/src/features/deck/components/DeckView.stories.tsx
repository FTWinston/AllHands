import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { DeckView as Component } from './DeckView';
import type { Snapshot } from '@colyseus/react';
import type { Meta, StoryObj } from '@storybook/react-vite';

const tacticalCards: CardType[] = ['phaserStrip', 'exampleEnemyTarget', 'exampleNoTarget', 'phaserCannon', 'phaserStrip', 'photonTorpedo', 'lowYield', 'highYield', 'fullSpread', 'weaponOvercharge', 'subCritical', 'rapidFire'];

function createDeck(types: CardType[]): Snapshot<CardInstance>[] {
    return types.map((type, index) => ({ id: index + 1, type }));
}

const meta: Meta<typeof Component> = {
    title: 'player-ui/Deck View',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        isOpen: true,
        atStation: false,
        cards: createDeck(tacticalCards),
        setOpen: fn(),
        moveCard: fn(),
        sellCard: fn(),
    },
    render: (args) => {
        // Act out what the server would do, so the deck can be tried out.
        const [cards, setCards] = useState(args.cards);
        const [isOpen, setOpen] = useState(args.isOpen);

        return (
            <>
                <button onClick={() => setOpen(true)}>Open</button>

                <Component
                    {...args}
                    cards={cards}
                    isOpen={isOpen}
                    setOpen={(open) => {
                        setOpen(open);
                        args.setOpen(open);
                    }}
                    moveCard={(cardId, toIndex) => {
                        setCards((cards) => {
                            const order = [...cards];
                            const [card] = order.splice(order.findIndex(card => card.id === cardId), 1);
                            order.splice(toIndex, 0, card);
                            return order;
                        });
                        args.moveCard(cardId, toIndex);
                    }}
                    sellCard={(cardId) => {
                        setCards(cards => cards.filter(card => card.id !== cardId));
                        args.sellCard(cardId);
                    }}
                />
            </>
        );
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Browsing: Story = {
    play: async ({ canvasElement }) => {
        // The view is portalled out of the story's canvas.
        const page = within(canvasElement.ownerDocument.body);
        await expect(await page.findByText('My deck')).toBeInTheDocument();
        await expect(page.getByText('#12')).toBeInTheDocument();
        await expect(page.queryAllByRole('button', { name: /Sell/ })).toHaveLength(0);
    },
};

/** Selling a card asks for confirmation first. */
export const AtStation: Story = {
    args: {
        atStation: true,
    },
    play: async ({ canvasElement, args }) => {
        const page = within(canvasElement.ownerDocument.body);
        const sellButtons = await page.findAllByRole('button', { name: /Sell/ });
        await expect(sellButtons).toHaveLength(12);

        await userEvent.click(sellButtons[0]);
        await expect(await page.findByText(/Sell .* for 10 antimatter\?/)).toBeInTheDocument();
        await userEvent.click(page.getByRole('button', { name: 'Cancel' }));
        await expect(args.sellCard).not.toHaveBeenCalled();

        await userEvent.click(sellButtons[1]);
        await userEvent.click(await page.findByRole('button', { name: 'OK' }));
        await expect(args.sellCard).toHaveBeenCalledWith(2);
    },
};

export const AtStationMinimumDeck: Story = {
    args: {
        atStation: true,
        cards: createDeck(tacticalCards.slice(0, 10)),
    },
    play: async ({ canvasElement }) => {
        const page = within(canvasElement.ownerDocument.body);
        await expect(await page.findByText(/your deck can't have fewer than 10 cards/)).toBeInTheDocument();

        for (const button of page.getAllByRole('button', { name: /Sell/ })) {
            await expect(button).toBeDisabled();
        }
    },
};

import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { cardSellPrice, shopCardPrice } from 'common-data/features/ships/utils/antimatter';
import { getStationDepartureNote } from 'common-ui/features/sectors/utils/stationDepartureLabels';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ShopPanel } from '../../shop/components/ShopPanel';
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
        crew: 'tactical',
        isOpen: true,
        atStation: false,
        antimatter: 20,
        cards: createDeck(tacticalCards),
        setOpen: fn(),
        moveCard: fn(),
        sellCard: fn(),
    },
    render: (args) => {
        // Act out what the server would do, so the deck can be tried out.
        const [cards, setCards] = useState(args.cards);
        const [antimatter, setAntimatter] = useState(args.antimatter);
        const [isOpen, setOpen] = useState(args.isOpen);

        return (
            <>
                <button onClick={() => setOpen(true)}>Open</button>

                <Component
                    {...args}
                    cards={cards}
                    antimatter={antimatter}
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
                        setAntimatter(antimatter => antimatter + cardSellPrice);
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
        await expect(page.queryByLabelText(/Antimatter/)).not.toBeInTheDocument();
    },
};

export const AtStation: Story = {
    args: {
        atStation: true,
    },
    play: async ({ canvasElement, args }) => {
        const page = within(canvasElement.ownerDocument.body);
        const sellButtons = await page.findAllByRole('button', { name: /Sell/ });
        await expect(sellButtons).toHaveLength(12);

        await userEvent.click(sellButtons[0]);
        await expect(args.sellCard).toHaveBeenCalledWith(1);
        await expect(await page.findByLabelText(`Antimatter: ${20 + cardSellPrice}`)).toBeInTheDocument();
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

export const AtStationWithAside: Story = {
    args: {
        atStation: true,
        crew: 'helm',
        cards: createDeck(['slowAndSteady', 'zigZag', 'strafe', 'faceTarget', 'exampleNoTarget', 'sweep', 'sweep', 'slowAndSteady', 'zigZag', 'slowAndSteady', 'strafe']),
        aside: (
            <section style={{ width: '20em', padding: '1em', border: '1px dashed var(--primary-mid)' }}>
                Something else at the station, e.g. a shop.
            </section>
        ),
    },
};

export const AtShopStation: Story = {
    args: {
        atStation: true,
        crew: 'helm',
        antimatter: 40,
        cards: createDeck(['slowAndSteady', 'zigZag', 'strafe', 'faceTarget', 'exampleNoTarget', 'sweep', 'sweep', 'slowAndSteady', 'zigZag', 'slowAndSteady', 'strafe']),
        notice: getStationDepartureNote('shopping', 'helm', 'helm'),
        aside: (
            <ShopPanel
                title="Navigation beacon"
                cards={[{ id: 101, type: 'fullReverse' }, { id: 102, type: 'strafe' }, { id: 103, type: 'sweep' }]}
                price={shopCardPrice}
                antimatter={40}
                buyCard={fn()}
                closeShop={fn()}
            />
        ),
    },
    play: async ({ canvasElement }) => {
        const page = within(canvasElement.ownerDocument.body);
        await expect(await page.findByRole('region', { name: 'Shop' })).toBeInTheDocument();
        await expect(page.getAllByRole('button', { name: /Buy/ })).toHaveLength(3);
        await expect(page.getByText(/to get the Warp Away card/)).toBeInTheDocument();
    },
};

export const AtShopStationWaitingForShopper: Story = {
    args: {
        atStation: true,
        crew: 'helm',
        cards: createDeck(['slowAndSteady', 'zigZag', 'strafe', 'faceTarget', 'exampleNoTarget', 'sweep', 'sweep', 'slowAndSteady', 'zigZag', 'slowAndSteady', 'strafe']),
        notice: getStationDepartureNote('shopping', 'tactical', 'helm'),
    },
    play: async ({ canvasElement }) => {
        const page = within(canvasElement.ownerDocument.body);
        await expect(await page.findByText('Waiting for Tactical to finish shopping, before you can warp away.')).toBeInTheDocument();
    },
};

export const AtStationReadyToLeave: Story = {
    args: {
        atStation: true,
        crew: 'helm',
        cards: createDeck(['slowAndSteady', 'zigZag', 'strafe', 'faceTarget', 'exampleNoTarget', 'sweep', 'sweep', 'slowAndSteady', 'zigZag', 'slowAndSteady', 'strafe']),
        notice: getStationDepartureNote('ready', null, 'helm'),
    },
    play: async ({ canvasElement, args }) => {
        const page = within(canvasElement.ownerDocument.body);
        await expect(await page.findByText('Play Warp Away to leave the station.')).toBeInTheDocument();

        await userEvent.click(page.getByRole('button', { name: 'Close' }));
        await expect(args.setOpen).toHaveBeenCalledWith(false);
    },
};

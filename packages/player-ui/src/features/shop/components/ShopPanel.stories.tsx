import { getShopCardPrice } from 'common-data/features/ships/utils/antimatter';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ShopPanel as Component } from './ShopPanel';
import type { Snapshot } from '@colyseus/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CardInstance } from 'common-data/features/cards/types/CardInstance';

const helmCards: Snapshot<CardInstance>[] = [
    { id: 101, type: 'slowReverse' },
    { id: 102, type: 'strafe' },
    { id: 103, type: 'sweep' },
    { id: 104, type: 'zigZag' },
    { id: 105, type: 'faceTarget' },
];

const meta: Meta<typeof Component> = {
    title: 'player-ui/Shop Panel',
    component: Component,
    args: {
        stationKind: 'navigationBeacon',
        cards: helmCards,
        antimatter: 40,
        buyCard: fn(),
    },
    render: (args) => {
        // Act out what the server and useShop would do, so the shop can be tried out.
        const [cards, setCards] = useState(args.cards);
        const [antimatter, setAntimatter] = useState(args.antimatter);

        return (
            <Component
                {...args}
                cards={cards}
                antimatter={antimatter}
                buyCard={(cardId) => {
                    const bought = cards.find(card => card.id === cardId);
                    setCards(cards => cards.filter(card => card.id !== cardId));
                    setAntimatter(antimatter => antimatter - (bought ? getShopCardPrice(bought.type) : 0));
                    args.buyCard(cardId);
                }}
            />
        );
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Affordable: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        // A card's Buy button only shows once it's focused.
        await expect(canvas.queryByRole('button', { name: /Buy/ })).not.toBeInTheDocument();

        await userEvent.click(canvas.getByText('Slow Reverse'));
        await userEvent.click(canvas.getByRole('button', { name: /Buy/ }));
        await expect(args.buyCard).toHaveBeenCalledWith(101);
        await expect(canvas.getAllByRole('listitem')).toHaveLength(4);

        // Each is common, so 40 - 15 leaves enough for one more, but not two.
        await userEvent.click(canvas.getByText('Strafe'));
        await userEvent.click(canvas.getByRole('button', { name: /Buy/ }));
        await userEvent.click(canvas.getByText('Sweep'));
        await expect(canvas.getByRole('button', { name: /Buy/ })).toBeDisabled();
        await expect(canvas.getByText(/enough antimatter/)).toBeInTheDocument();
    },
};

export const Unaffordable: Story = {
    args: {
        antimatter: 10,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByText('Zig-zag'));
        await expect(canvas.getByRole('button', { name: /Buy/ })).toBeDisabled();
    },
};

export const SoldOut: Story = {
    args: {
        cards: [],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Sold out.')).toBeInTheDocument();
    },
};

export const ArmsDealer: Story = {
    args: {
        stationKind: 'armsDealer',
        cards: [
            { id: 201, type: 'photonicCannon' },
            { id: 202, type: 'quantumTorpedo' },
            { id: 203, type: 'extendedRange' },
            { id: 204, type: 'highIntensity' },
            { id: 205, type: 'flare' },
        ],
    },
};

/** Cards of each rarity, priced differently and marked on the card. */
export const Rarities: Story = {
    args: {
        stationKind: 'armsDealer',
        antimatter: 30,
        cards: [
            { id: 301, type: 'phaserStrip' },
            { id: 302, type: 'tractorBeam' },
            { id: 303, type: 'alphaStrike' },
        ],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByLabelText('Rare')).toBeInTheDocument();
        await expect(canvas.getByLabelText('Uncommon')).toBeInTheDocument();

        // 30 antimatter buys the uncommon card, but not the rare one.
        await userEvent.click(canvas.getByText('Tractor Beam'));
        await expect(canvas.getByRole('button', { name: /Buy/ })).toBeEnabled();
        await userEvent.click(canvas.getByText('Alpha Strike'));
        await expect(canvas.getByRole('button', { name: /Buy for 40/ })).toBeDisabled();
    },
};

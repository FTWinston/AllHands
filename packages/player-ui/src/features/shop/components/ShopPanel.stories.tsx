import { shopCardPrice } from 'common-data/features/ships/utils/antimatter';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ShopPanel as Component } from './ShopPanel';
import type { Snapshot } from '@colyseus/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CardInstance } from 'common-data/features/cards/types/CardInstance';

const helmCards: Snapshot<CardInstance>[] = [
    { id: 101, type: 'fullReverse' },
    { id: 102, type: 'strafe' },
    { id: 103, type: 'sweep' },
];

const meta: Meta<typeof Component> = {
    title: 'player-ui/Shop Panel',
    component: Component,
    args: {
        title: 'Navigation beacon',
        cards: helmCards,
        price: shopCardPrice,
        antimatter: 50,
        isOpen: true,
        buyCard: fn(),
        openShop: fn(),
        closeShop: fn(),
    },
    render: (args) => {
        // Act out what the server and useShop would do, so the shop can be tried out.
        const [cards, setCards] = useState(args.cards);
        const [antimatter, setAntimatter] = useState(args.antimatter);
        const [isOpen, setOpen] = useState(args.isOpen);

        return (
            <Component
                {...args}
                cards={cards}
                antimatter={antimatter}
                isOpen={isOpen}
                openShop={() => {
                    setOpen(true);
                    args.openShop();
                }}
                closeShop={() => {
                    setOpen(false);
                    args.closeShop();
                }}
                buyCard={(cardId) => {
                    setCards(cards => cards.filter(card => card.id !== cardId));
                    setAntimatter(antimatter => antimatter - args.price);
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
        const buttons = canvas.getAllByRole('button', { name: /Buy/ });
        await expect(buttons).toHaveLength(3);

        await userEvent.click(buttons[0]);
        await expect(args.buyCard).toHaveBeenCalledWith(101);
        await expect(canvas.getAllByRole('button', { name: /Buy/ })).toHaveLength(2);

        // 50 - 20 leaves enough for one more, but not two.
        await userEvent.click(canvas.getAllByRole('button', { name: /Buy/ })[0]);
        for (const button of canvas.getAllByRole('button', { name: /Buy/ })) {
            await expect(button).toBeDisabled();
        }
        await expect(canvas.getByText(/enough antimatter/)).toBeInTheDocument();
    },
};

export const Unaffordable: Story = {
    args: {
        antimatter: 10,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        for (const button of canvas.getAllByRole('button', { name: /Buy/ })) {
            await expect(button).toBeDisabled();
        }
    },
};

export const SoldOut: Story = {
    args: {
        cards: [],
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Sold out.')).toBeInTheDocument();

        await userEvent.click(canvas.getByRole('button', { name: 'Close shop' }));
        await expect(args.closeShop).toHaveBeenCalled();
    },
};

export const CloseAndReopen: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Close shop' }));
        await expect(args.closeShop).toHaveBeenCalled();
        await expect(canvas.queryByRole('button', { name: /Buy/ })).not.toBeInTheDocument();

        await userEvent.click(canvas.getByRole('button', { name: 'Open shop' }));
        await expect(args.openShop).toHaveBeenCalled();
        await expect(canvas.getAllByRole('button', { name: /Buy/ })).toHaveLength(3);
    },
};

export const Closed: Story = {
    args: {
        isOpen: false,
    },
};

export const ArmsDealer: Story = {
    args: {
        title: 'Arms dealer',
        cards: [
            { id: 201, type: 'photonicCannon' },
            { id: 202, type: 'quantumTorpedo' },
            { id: 203, type: 'extendedRange' },
        ],
    },
};

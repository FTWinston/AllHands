import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { DeliveryPanel as Component } from './DeliveryPanel';
import type { Snapshot } from '@colyseus/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CardInstance } from 'common-data/features/cards/types/CardInstance';

const deliveredCards: Snapshot<CardInstance>[] = [
    { id: 301, type: 'extendedRange' },
    { id: 302, type: 'projectileManoeuvrability' },
    { id: 303, type: 'highYield' },
];

const meta: Meta<typeof Component> = {
    title: 'player-ui/Delivery Panel',
    component: Component,
    args: {
        cards: deliveredCards,
        takeDelivery: fn(),
    },
    render: (args) => {
        // Act out what the server would do: taking one card discards the rest.
        const [cards, setCards] = useState(args.cards);

        return cards.length > 0
            ? (
                <Component
                    {...args}
                    cards={cards}
                    takeDelivery={(cardId) => {
                        setCards([]);
                        args.takeDelivery(cardId);
                    }}
                />
            )
            : <p>Delivery taken.</p>;
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ChooseOne: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText(/your delivery will be lost/)).toBeInTheDocument();

        const buttons = canvas.getAllByRole('button', { name: 'Take' });
        await expect(buttons).toHaveLength(3);

        await userEvent.click(buttons[1]);
        await expect(args.takeDelivery).toHaveBeenCalledWith(302);
    },
};

export const FewerMatches: Story = {
    args: {
        cards: deliveredCards.slice(0, 2),
    },
};

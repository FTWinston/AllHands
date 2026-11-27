import { expect, fn, userEvent, within } from 'storybook/test';
import { IncomingCardPanel as Component } from './IncomingCardPanel';
import type { Snapshot } from '@colyseus/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CardInstance } from 'common-data/features/cards/types/CardInstance';

const deck: Snapshot<CardInstance>[] = [
    { id: 1, type: 'phaserStrip' },
    { id: 2, type: 'phaserStrip' },
    { id: 3, type: 'phaserCannon' },
    { id: 4, type: 'photonTorpedo' },
    { id: 5, type: 'efficiency' },
    { id: 6, type: 'highYield' },
    { id: 7, type: 'powerCell' },
    { id: 8, type: 'acquireLock' },
    { id: 9, type: 'lowYield' },
    { id: 10, type: 'extendedRange' },
    { id: 11, type: 'fullSpread' },
    { id: 12, type: 'siegeLance' },
];

const meta: Meta<typeof Component> = {
    title: 'player-ui/Incoming Card Panel',
    component: Component,
    args: {
        card: { id: 601, type: 'quantumTorpedo' },
        count: 1,
        deckCards: deck,
        maxDeckSize: 12,
        replaceDeckCard: fn(),
        discardIncomingCard: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ReplaceACard: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText(/Your deck holds 12 cards/)).toBeInTheDocument();
        await expect(within(canvas.getByRole('list', { name: 'Cards to replace' })).getAllByRole('listitem')).toHaveLength(12);

        await userEvent.click(canvas.getByText('Siege Lance'));
        await userEvent.click(canvas.getByRole('button', { name: 'Replace' }));
        await expect(args.replaceDeckCard).toHaveBeenCalledWith(12);
    },
};

export const DiscardIt: Story = {
    args: {
        count: 2,
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('1 more waiting after this.')).toBeInTheDocument();
        await userEvent.click(canvas.getByRole('button', { name: 'Discard new card' }));
        await expect(args.discardIncomingCard).toHaveBeenCalled();
    },
};

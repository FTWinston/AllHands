import { expect, fn, userEvent, within } from 'storybook/test';
import { SalvagePrompt as Component } from './SalvagePrompt';
import type { Snapshot } from '@colyseus/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { SalvageCardInfo } from 'common-data/features/cards/types/CardRewardInfo';

const salvage: Snapshot<SalvageCardInfo>[] = [
    { role: 'helm', card: { id: 401, type: 'burn' }, deckSize: 9, maxDeckSize: 12 },
    { role: 'tactical', card: { id: 402, type: 'quantumTorpedo' }, deckSize: 12, maxDeckSize: 12 },
    { role: 'engineer', card: { id: 403, type: 'trickleCharge' }, deckSize: 8, maxDeckSize: 12 },
];

const meta: Meta<typeof Component> = {
    title: 'player-ui/Salvage Prompt',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        cards: salvage,
        takeSalvage: fn(),
        scrapSalvage: fn(),
        hideSalvage: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const GiveToCrewMember: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('alertdialog', { name: 'Salvage' })).toBeInTheDocument();
        await expect(canvas.getByText('12/12')).toHaveAttribute('title', 'Tactical\'s deck is full, so they\'d replace a card');

        // A card's button only shows once it's focused.
        await expect(canvas.queryByRole('button', { name: 'Give to Engineer' })).not.toBeInTheDocument();
        await userEvent.click(canvas.getByText('Trickle Charge'));
        await userEvent.click(canvas.getByRole('button', { name: 'Give to Engineer' }));
        await expect(args.takeSalvage).toHaveBeenCalledWith(403);
    },
};

export const ScrapAll: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: /Scrap all for 10/ }));
        await expect(args.scrapSalvage).toHaveBeenCalled();
    },
};

export const HoldToSeeMap: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const button = canvas.getByRole('button', { name: 'Hold to see the map' });
        // One pointer, held between calls.
        const user = userEvent.setup();

        await user.pointer({ keys: '[MouseLeft>]', target: button });
        await expect(args.hideSalvage).toHaveBeenLastCalledWith(true);
        await expect(button).toHaveAttribute('aria-pressed', 'true');
        await expect(canvas.getByText('Trickle Charge')).not.toBeVisible();

        await user.pointer({ keys: '[/MouseLeft]', target: button });
        await expect(args.hideSalvage).toHaveBeenLastCalledWith(false);
        await expect(args.hideSalvage).toHaveBeenCalledTimes(2);
        await expect(canvas.getByText('Trickle Charge')).toBeVisible();
    },
};

import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { BundleVotePanel as Component } from './BundleVotePanel';
import type { BundleOption } from '../types/RewardsModel';
import type { Meta, StoryObj } from '@storybook/react-vite';

const bundles: BundleOption[] = [
    { index: 0, card: { id: 501, type: 'phaserCannon' }, standout: false, voters: ['helm'] },
    { index: 1, card: { id: 502, type: 'photonicCannon' }, standout: true, voters: [] },
    { index: 2, card: { id: 503, type: 'highYield' }, standout: false, voters: ['science', 'engineer'] },
];

const meta: Meta<typeof Component> = {
    title: 'player-ui/Bundle Vote Panel',
    component: Component,
    args: {
        bundles,
        vote: null,
        votesNeeded: 3,
        voteBundle: fn(),
    },
    render: (args) => {
        // Act out what the server would do: record tactical's vote.
        const [vote, setVote] = useState(args.vote);
        const shown = args.bundles.map(bundle => ({
            ...bundle,
            voters: [...bundle.voters.filter(role => role !== 'tactical'), ...(bundle.index === vote ? ['tactical' as const] : [])],
        }));

        return (
            <Component
                {...args}
                bundles={shown}
                vote={vote}
                voteBundle={(index) => {
                    setVote(index);
                    args.voteBundle(index);
                }}
            />
        );
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Vote: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Standout')).toBeInTheDocument();
        await expect(within(canvas.getByRole('list', { name: 'Votes for bundle 3' })).getAllByRole('listitem')).toHaveLength(2);

        await userEvent.click(canvas.getByText('Photonic Cannon'));
        await userEvent.click(canvas.getByRole('button', { name: 'Vote' }));
        await expect(args.voteBundle).toHaveBeenCalledWith(1);
        await expect(within(canvas.getByRole('list', { name: 'Votes for bundle 2' })).getByText('Tactical')).toBeInTheDocument();
    },
};

export const AlreadyVoted: Story = {
    args: {
        vote: 2,
    },
};

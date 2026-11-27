import { expect, fn, userEvent, within } from 'storybook/test';
import { OutfitPicksPanel as Component } from './OutfitPicksPanel';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Outfit Picks Panel',
    component: Component,
    args: {
        cards: [
            { id: 701, type: 'burn' },
            { id: 702, type: 'lockOn' },
            { id: 703, type: 'sweep' },
        ],
        takeOutfitCard: fn(),
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ChooseOne: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText(/can't leave until every crew member has chosen/)).toBeInTheDocument();

        await userEvent.click(canvas.getByText('Hold Steady'));
        await userEvent.click(canvas.getByRole('button', { name: 'Take' }));
        await expect(args.takeOutfitCard).toHaveBeenCalledWith(702);
    },
};

import { shopCardPrice } from 'common-data/features/ships/utils/antimatter';
import { expect, fn, within } from 'storybook/test';
import { NonEncounterDisplay as Component } from './NonEncounterDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Non-Encounter Display',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        crew: 'helm',
        onPause: fn(),
        deckSize: 10,
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** At a navigation beacon, helm's shop fills the display beneath the header, above their hand with the Warp Away card to leave. */
export const AtShopStation: Story = {
    args: {
        hand: [{ id: 201, type: 'warpAway' }],
        playHandCard: fn(),
        shop: {
            title: 'Navigation beacon',
            cards: [{ id: 101, type: 'fullReverse' }, { id: 102, type: 'strafe' }, { id: 103, type: 'sweep' }],
            price: shopCardPrice,
            antimatter: 40,
            buyCard: fn(),
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('region', { name: 'Shop' })).toBeInTheDocument();
        await expect(canvas.getAllByRole('button', { name: /Buy/ })).toHaveLength(3);
        await expect(await canvas.findByText('Warp Away')).toBeInTheDocument();
    },
};

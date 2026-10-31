import { shopCardPrice } from 'common-data/features/ships/utils/antimatter';
import { expect, fn, userEvent, within } from 'storybook/test';
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
            cards: [{ id: 101, type: 'fullReverse' }, { id: 102, type: 'strafe' }, { id: 103, type: 'sweep' }],
            price: shopCardPrice,
            antimatter: 40,
            buyCard: fn(),
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('region', { name: 'Buy cards' })).toBeInTheDocument();
        await expect(canvas.getAllByRole('button', { name: /Buy/ })).toHaveLength(3);
        await expect(await canvas.findByText('Warp Away')).toBeInTheDocument();
    },
};

/**
 * At a shop station for another crew member, tactical can place a work order. The panel shows even when the ship can't afford one,
 * so its cards can still be looked at. The order dialog's title and close button are shown in the crew header.
 */
export const OrderingElsewhere: Story = {
    args: {
        crew: 'tactical',
        orders: {
            crew: 'tactical',
            canOrder: true,
            price: 45,
            antimatter: 30,
            deckCards: [{ id: 1, type: 'photonTorpedo' }, { id: 2, type: 'phaserStrip' }],
            orderableCardIds: [1, 2],
            pendingOrder: null,
            previewCardId: null,
            preview: [],
            deliveryCards: [],
            previewOrder: fn(),
            placeOrder: fn(),
            takeDelivery: fn(),
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // The dialog is rendered in a portal, outside the canvas.
        const page = within(canvasElement.ownerDocument.body);
        await expect(canvas.getByText('30')).toBeInTheDocument();
        await expect(canvas.getByRole('region', { name: 'Order a card' })).toHaveTextContent(/You need 15 more/);

        await userEvent.click(canvas.getByRole('button', { name: /Place order/ }));
        await expect(await page.findByRole('dialog', { name: 'Order a card' })).toBeInTheDocument();
    },
};

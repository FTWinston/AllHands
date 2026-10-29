import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { OrderPreviewCardInfo } from 'common-data/features/cards/types/OrderPreviewCardInfo';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { OrderPanel as Component } from './OrderPanel';
import type { Snapshot } from '@colyseus/react';
import type { Meta, StoryObj } from '@storybook/react-vite';

const tacticalCards: CardType[] = ['phaserStrip', 'exampleEnemyTarget', 'phaserCannon', 'photonTorpedo', 'lowYield', 'highYield'];

const deckCards: Snapshot<CardInstance>[] = tacticalCards.map((type, index) => ({ id: index + 1, type }));

/** Everything but the placeholder card has matches. */
const orderableCardIds = deckCards.filter(card => card.type !== 'exampleEnemyTarget').map(card => card.id);

/** What the server would preview for any card: some owned, some new, and one the crew hasn't come across. */
const preview: Snapshot<OrderPreviewCardInfo>[] = [
    { type: 'lowYield', owned: true },
    { type: 'highYield', owned: true },
    { type: 'extendedRange', owned: false },
    { type: null, owned: false },
    { type: null, owned: false },
];

const meta: Meta<typeof Component> = {
    title: 'player-ui/Order Panel',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        crew: 'tactical',
        canOrder: true,
        price: 45,
        antimatter: 60,
        deckCards,
        orderableCardIds,
        pendingOrder: null,
        previewCardId: null,
        preview: [],
        deliveryCards: [],
        previewOrder: fn(),
        placeOrder: fn(),
        takeDelivery: fn(),
    },
    render: (args) => {
        // Act out what the server would do, so an order can be placed.
        const [previewCardId, setPreviewCardId] = useState(args.previewCardId);
        const [pendingOrder, setPendingOrder] = useState(args.pendingOrder);
        const [antimatter, setAntimatter] = useState(args.antimatter);

        return (
            <Component
                {...args}
                previewCardId={previewCardId}
                preview={previewCardId === null ? [] : preview}
                pendingOrder={pendingOrder}
                antimatter={antimatter}
                previewOrder={(cardId) => {
                    setPreviewCardId(cardId);
                    args.previewOrder(cardId);
                }}
                placeOrder={(cardId) => {
                    setPendingOrder(deckCards.find(card => card.id === cardId)!.type);
                    setAntimatter(antimatter => antimatter - args.price);
                    args.placeOrder(cardId);
                }}
            />
        );
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PlaceOrder: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        // The dialog is rendered in a portal, outside the canvas.
        const page = within(canvasElement.ownerDocument.body);

        await userEvent.click(canvas.getByRole('button', { name: /Place order/ }));

        const choose = page.getAllByRole('button', { name: 'Choose' });
        await expect(choose).toHaveLength(orderableCardIds.length);
        await expect(page.getByRole('button', { name: 'No matches' })).toBeDisabled();

        await userEvent.click(choose[2]);
        await expect(args.previewOrder).toHaveBeenCalledWith(4);
        await expect(page.getAllByText('Unknown design')).toHaveLength(2);
        await expect(page.getAllByText('In your deck')).toHaveLength(2);

        await userEvent.click(page.getByRole('button', { name: /Order for/ }));
        await expect(args.placeOrder).toHaveBeenCalledWith(4);
        await expect(canvas.getByText('Work order placed')).toBeInTheDocument();
    },
};

export const Unaffordable: Story = {
    args: {
        antimatter: 30,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const page = within(canvasElement.ownerDocument.body);

        await userEvent.click(canvas.getByRole('button', { name: /Place order/ }));
        await userEvent.click(page.getAllByRole('button', { name: 'Choose' })[0]);

        await expect(page.getByRole('button', { name: /Order for/ })).toBeDisabled();
        await expect(page.getByText(/You need 45 antimatter/)).toBeInTheDocument();
    },
};

export const Pending: Story = {
    args: {
        canOrder: false,
        pendingOrder: 'photonTorpedo',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Work order placed')).toBeInTheDocument();
        await expect(canvas.queryByRole('button')).not.toBeInTheDocument();
    },
};

import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { useState } from 'react';
import { expect, fn, within } from 'storybook/test';
import { SystemCardsDialog as Component } from './SystemCardsDialog';
import type { Snapshot } from '@colyseus/react';
import type { Meta, StoryObj } from '@storybook/react-vite';

function createCards(types: CardType[], firstId: number): Snapshot<CardInstance>[] {
    return types.map((type, index) => ({ id: firstId + index, type }));
}

const meta: Meta<typeof Component> = {
    title: 'player-ui/Engineer/System Cards',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        system: 'tactical',
        isOpen: true,
        setOpen: fn(),
        hand: createCards(['phaserStrip', 'lowYield'], 1),
        deck: [
            ...createCards(['photonTorpedo', 'phaserCannon'], 3),
            { id: 5, type: 'highYield', extraTraits: { damaged: ExtraTraitType.Normal } },
            ...createCards(['fullSpread', 'weaponOvercharge', 'subCritical'], 6),
            { id: 9, type: 'rapidFire', extraTraits: { expendable: ExtraTraitType.Normal } },
        ],
        pendingDrawChoice: [],
    },
    render: (args) => {
        const [isOpen, setOpen] = useState(args.isOpen);

        return (
            <>
                <button onClick={() => setOpen(true)}>Open</button>

                <Component
                    {...args}
                    isOpen={isOpen}
                    setOpen={(open) => {
                        setOpen(open);
                        args.setOpen(open);
                    }}
                />
            </>
        );
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CrewSystem: Story = {
    play: async ({ canvasElement }) => {
        // The dialog is portalled out of the story's canvas.
        const page = within(canvasElement.ownerDocument.body);
        await expect(await page.findByText('Tactical cards')).toBeInTheDocument();

        await expect(page.getByRole('list', { name: 'Hand' }).children).toHaveLength(2);
        await expect(page.getByRole('list', { name: 'Deck' }).children).toHaveLength(7);
        await expect(page.queryByRole('list', { name: 'Revealed' })).not.toBeInTheDocument();

        // Only the deck is numbered.
        await expect(page.getAllByText(/^#\d+$/)).toHaveLength(7);
    },
};

/** Hull and reactor cards are played as soon as they're drawn, so there's no hand to show. */
export const Reactor: Story = {
    args: {
        system: 'reactor',
        hand: [],
        deck: createCards(['reactorPowerHull', 'reactorPowerHelm', 'reactorPowerTactical', 'reactorPowerEngineer', 'reactorPowerScience', 'reactorPowerReactor'], 1),
    },
    play: async ({ canvasElement }) => {
        const page = within(canvasElement.ownerDocument.body);
        await expect(await page.findByText('Reactor cards')).toBeInTheDocument();
        await expect(page.queryByText('Hand')).not.toBeInTheDocument();
        await expect(page.getByRole('list', { name: 'Deck' }).children).toHaveLength(6);
    },
};

/** Cards revealed for a draw choice have left the deck, so are shown separately. */
export const DrawChoice: Story = {
    args: {
        system: 'science',
        hand: [],
        pendingDrawChoice: createCards(['passiveScan', 'polaronScan', 'tetryonScan'], 1),
        deck: createCards(['phasedBurstScan', 'invertedPulseScan', 'coherentChronitonScan'], 4),
    },
    play: async ({ canvasElement }) => {
        const page = within(canvasElement.ownerDocument.body);
        await expect((await page.findByRole('list', { name: 'Revealed' })).children).toHaveLength(3);
        await expect(page.getByText('No cards in hand.')).toBeInTheDocument();
    },
};

export const EmptyDeck: Story = {
    args: {
        system: 'helm',
        hand: createCards(['zigZag'], 1),
        deck: [],
    },
    play: async ({ canvasElement }) => {
        const page = within(canvasElement.ownerDocument.body);
        await expect(await page.findByText('The deck is empty.')).toBeInTheDocument();
    },
};

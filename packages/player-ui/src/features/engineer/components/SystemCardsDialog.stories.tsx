import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
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

/** The hull's shield stats are shown above its cards. */
export const Hull: Story = {
    args: {
        system: 'hull',
        hand: [],
        deck: [
            ...createCards(['hullShieldEmitter', 'hullShieldTuningEnergy'], 1),
            { id: 3, type: 'hullShieldEmitter', extraTraits: { damaged: ExtraTraitType.Normal } },
            ...createCards(['hullVolatileEmitter', 'hullPlating', 'hullShieldTuningTorpedo'], 4),
        ],
        shield: {
            capacity: 60,
            level: 30,
            power: 3,
            tuning: 'energy',
            scrambled: 0,
        },
    },
    play: async ({ canvasElement }) => {
        const page = within(canvasElement.ownerDocument.body);
        const shields = await page.findByRole('region', { name: 'Shields' });
        await expect(within(shields).getByText('60')).toBeInTheDocument();
        // Half full at power 3: 80% × (1 - (1/2)²).
        await expect(within(shields).getByText('60%')).toBeInTheDocument();
        await expect(within(shields).getByText('Energy')).toBeInTheDocument();
        await expect(within(shields).getByText(/30 \/ 60/)).toBeInTheDocument();
    },
};

/**
 * As cards are drawn, the rest move up the deck. Those at the start of a row wrap around to the end of the row above.
 * The hand holds up to five cards, so it gets a second row on the second draw, and the deck below glides down to make room.
 */
export const Drawing: Story = {
    render: (args) => {
        const [cards, setCards] = useState({ hand: args.hand, deck: args.deck });

        const draw = () => setCards(({ hand, deck }) => (deck.length > 0
            ? { hand: [...hand.slice(-4), deck[0]], deck: deck.slice(1) }
            : { hand, deck }));

        return (
            <>
                <button onClick={draw}>Draw</button>

                <Component {...args} {...cards} />
            </>
        );
    },
    play: async ({ canvasElement }) => {
        const page = within(canvasElement.ownerDocument.body);
        const deck = await page.findByRole('list', { name: 'Deck' });
        const cardAt = (index: number) => deck.children[index].querySelector('[data-shift-card-id]')!;
        const drawnCard = cardAt(0);
        const nextCard = cardAt(1);
        const wrappingCard = cardAt(3);

        await userEvent.click(page.getByRole('button', { name: 'Draw' }));

        // Each moved up one place.
        await expect(cardAt(0)).toBe(nextCard);
        await expect(cardAt(2)).toBe(wrappingCard);

        // The drawn card is put back, hidden from assistive tech, while it slides away.
        const leaving = deck.lastElementChild!;
        await expect(leaving).toContainElement(drawnCard as HTMLElement);
        await expect(leaving).toHaveAttribute('aria-hidden', 'true');
        await expect(leaving.getAnimations()).toHaveLength(1);

        // A card on the same row just slides, but one changing rows also fades out and back in.
        const keyframes = (card: Element) => (card.getAnimations()[0] as Animation & { effect: KeyframeEffect }).effect.getKeyframes();
        await expect(keyframes(nextCard)).toHaveLength(2);
        await expect(keyframes(wrappingCard)).toHaveLength(4);

        // The hand's height only animates once it gets another row.
        const hand = page.getByRole('list', { name: 'Hand' });
        await expect(hand.getAnimations()).toHaveLength(0);

        await userEvent.click(page.getByRole('button', { name: 'Draw' }));
        await expect(hand.children).toHaveLength(4);
        await expect(hand.getAnimations()).toHaveLength(1);
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

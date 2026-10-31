import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { useState } from 'react';
import { DragCardProvider } from 'src/features/cardui/components/DragCardProvider';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CrewHeader as Component } from './CrewHeader';
import type { Snapshot } from '@colyseus/react';
import type { Meta, StoryObj } from '@storybook/react-vite';

const cardTypes: CardType[] = ['slowAndSteady', 'zigZag', 'strafe', 'faceTarget', 'exampleNoTarget', 'sweep', 'sweep', 'slowAndSteady', 'zigZag', 'slowAndSteady'];
const cards: Snapshot<CardInstance>[] = cardTypes.map((type, index) => ({ id: index + 1, type }));

const meta: Meta<typeof Component> = {
    title: 'player-ui/Crew Header',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        crew: 'helm',
        onPause: fn(),
        power: 3,
        deckSize: cards.length,
    },
    render: args => (
        <DragCardProvider onCardDropped={fn()}>
            <Component {...args} />
        </DragCardProvider>
    ),
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The deck indicator shows card generation progress, and is a target for discarding cards. */
export const InEncounter: Story = {
    args: {
        cardGeneration: { startTime: Date.now(), endTime: Date.now() + 10000 },
    },
};

/** The deck indicator is a toggle button for the "my deck" view. Power isn't shown at a station, as no cards are played there. */
export const AtStation: Story = {
    args: {
        power: undefined,
    },
    render: (args) => {
        const [isOpen, setOpen] = useState(false);

        return (
            <Component
                {...args}
                deckView={{
                    cards,
                    isOpen,
                    setOpen,
                    atStation: false,
                    moveCard: fn(),
                    sellCard: fn(),
                }}
            />
        );
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const page = within(canvasElement.ownerDocument.body);

        // The meta's power of 3 isn't shown.
        await expect(canvas.queryByText('3')).not.toBeInTheDocument();

        const button = canvas.getByRole('button', { name: /My deck/ });
        await expect(button).toHaveAttribute('aria-pressed', 'false');

        await userEvent.click(button);

        // Its title is shown in the crew header, rather than in a header of its own.
        await expect(await canvas.findByRole('heading', { name: 'My deck' })).toBeInTheDocument();
        await expect(canvas.getByText(args.crew)).not.toBeVisible();
        await expect(page.getByText('#10')).toBeInTheDocument();

        // It stays open, rather than treating the click that opened it as an outside press.
        await new Promise(resolve => setTimeout(resolve, 300));
        await expect(button).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByRole('dialog')).toBeInTheDocument();

        // The header isn't covered, so its menu can still be used, without closing the deck view.
        await userEvent.click(canvas.getByRole('button', { name: 'Menu' }));
        await userEvent.click(await page.findByRole('menuitem', { name: 'Pause game' }));
        await expect(args.onPause).toHaveBeenCalled();
        await expect(page.getByRole('dialog')).toBeInTheDocument();

        // The same button closes it again, as does the deck view's own close button.
        await userEvent.click(button);
        await expect(button).toHaveAttribute('aria-pressed', 'false');

        await userEvent.click(button);
        await userEvent.click(await page.findByRole('button', { name: 'Close' }));
        await expect(button).toHaveAttribute('aria-pressed', 'false');
    },
};

/** Outside of an encounter, every crew member sees the ship's antimatter. */
export const Shopping: Story = {
    args: {
        power: undefined,
        antimatter: 40,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('40')).toBeInTheDocument();
    },
};

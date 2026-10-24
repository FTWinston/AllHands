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

/** The deck indicator is a toggle button for the "my deck" view. */
export const OutsideEncounter: Story = {
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
                    antimatter: 0,
                    moveCard: fn(),
                    sellCard: fn(),
                }}
            />
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const page = within(canvasElement.ownerDocument.body);

        const button = canvas.getByRole('button', { name: /My deck/ });
        await expect(button).toHaveAttribute('aria-pressed', 'false');

        await userEvent.click(button);
        await expect(await page.findByText('My deck')).toBeInTheDocument();
        await expect(page.getByText('#10')).toBeInTheDocument();

        // It stays open, rather than treating the click that opened it as an outside press.
        await new Promise(resolve => setTimeout(resolve, 300));
        await expect(button).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByRole('dialog')).toBeInTheDocument();

        await userEvent.click(page.getByRole('button', { name: 'Close' }));
        await expect(button).toHaveAttribute('aria-pressed', 'false');
    },
};

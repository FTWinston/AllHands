import { knowableCardTypes, knowableCardTypesByRole } from 'common-data/features/cards/utils/getKnowableCardTypes';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CardCompendiumDisplay as Component } from './CardCompendiumDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CardType } from 'common-data/features/cards/utils/cardDefinitions';

const meta = {
    title: 'game-ui/Card Compendium',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        back: fn(),
    },
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoneKnown: Story = {
    args: {
        known: new Set(),
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText(`0 / ${knowableCardTypes.size}`)).toBeInTheDocument();

        await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
        await expect(args.back).toHaveBeenCalled();
    },
};

/** Every other card of each crew member's, as if partway through discovering them. */
export const SomeKnown: Story = {
    args: {
        known: new Set<CardType>(Object.values(knowableCardTypesByRole).flatMap(types => types.filter((_, index) => index % 2 === 0))),
    },
};

export const AllKnown: Story = {
    args: {
        known: knowableCardTypes,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText(`${knowableCardTypes.size} / ${knowableCardTypes.size}`)).toBeInTheDocument();
    },
};

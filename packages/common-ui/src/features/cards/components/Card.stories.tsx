import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { expect, within } from 'storybook/test';
import { Card as Component } from './Card';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
    title: 'common-ui/features/cards/Card',
    component: Component,
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Helm: Story = {
    args: {
        type: 'slowAndSteady',
    },
};

export const Tactical: Story = {
    args: {
        type: 'lowYield',
    },
};

export const Science: Story = {
    args: {
        type: 'exampleNoTarget',
    },
};

export const HighlightedHelm: Story = {
    args: {
        type: 'slowAndSteady',
        highlighted: true,
    },
};

export const DamagedTactical: Story = {
    args: {
        type: 'lowYield',
        extraTraits: {
            damaged: ExtraTraitType.Normal,
        },
    },
};

export const StabilisedTactical: Story = {
    args: {
        type: 'lowYield',
        extraTraits: {
            stabilised: ExtraTraitType.Normal,
        },
    },
};

export const CriticalTactical: Story = {
    args: {
        type: 'lowYield',
        extraTraits: {
            critical: ExtraTraitType.Normal,
        },
    },
};

/** An uncommon card is marked with one diamond. */
export const UncommonTactical: Story = {
    args: {
        type: 'tractorBeam',
    },
    play: async ({ canvasElement }) => {
        const marker = within(canvasElement).getByRole('img', { name: 'Uncommon' });
        await expect(marker).toHaveTextContent('◆');
    },
};

/** A rare card is marked with two diamonds. */
export const RareTactical: Story = {
    args: {
        type: 'alphaStrike',
    },
    play: async ({ canvasElement }) => {
        const marker = within(canvasElement).getByRole('img', { name: 'Rare' });
        await expect(marker).toHaveTextContent('◆◆');
    },
};

/** A card that also costs Insight to play, as well as power. */
export const InsightCostScience: Story = {
    args: {
        type: 'eureka',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('img', { name: 'Costs 3 Insight' })).toHaveTextContent('3');
        await expect(canvas.getByText(/Insight/)).toBeInTheDocument();
    },
};

/** The same card when science hasn't enough Insight to play it, as the science display shows it. */
export const InsightCostScienceUnplayable: Story = {
    args: {
        type: 'eureka',
        disabled: true,
    },
};

import crewStyles from 'common-ui/CrewColors.module.css';
import { fn } from 'storybook/test';
import { CrewHeader as Component } from './CrewHeader';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Crew Header',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        onPause: fn(),
    },
    render: args => (
        <div className={crewStyles[args.crew]}>
            <Component {...args} />
        </div>
    ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Helm: Story = {
    args: {
        crew: 'helm',
    },
};

export const Tactical: Story = {
    args: {
        crew: 'tactical',
    },
};

export const Sensors: Story = {
    args: {
        crew: 'sensors',
    },
};

export const Engineer: Story = {
    args: {
        crew: 'engineer',
    },
};

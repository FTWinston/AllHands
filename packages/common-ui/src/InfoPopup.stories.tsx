import { InfoPopup as Component } from './InfoPopup';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'common-ui/Info Popup',
    component: Component,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const InfoPopup: Story = {
    args: {
        name: 'Some Popover',
        description: 'This is a description of a basic popover, that tells you a little bit about it.',
        children: <span>Touch me</span>,
    },
};

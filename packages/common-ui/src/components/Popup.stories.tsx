import { Popover } from '@base-ui-components/react/popover';
import { Popup as Component } from './Popup';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'common-ui/components/Popup',
    component: Component,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Popup: Story = {
    args: {
        name: 'Some Popup',
        description: <>This is a description of a basic popup, that tells you a little bit about it.</>,
    },
    render: args => (
        <Popover.Root>
            <Popover.Trigger>Click me to open the popup</Popover.Trigger>
            <Component {...args} />
        </Popover.Root>
    ),
};

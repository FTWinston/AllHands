import { RadioGroup as Component } from './RadioGroup';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
    title: 'common-ui/components/Radio Group',
    component: Component,
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RadioGroup: Story = {
    args: {
        value: 'option1',
        setValue: () => {},
        options: [
            { id: 'option1', label: 'Option 1' },
            { id: 'option2', label: 'Option 2' },
            { id: 'option3', label: 'Option 3' },
        ],
    },
};

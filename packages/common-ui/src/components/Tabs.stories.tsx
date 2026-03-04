import { Tabs as Component } from './Tabs';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
    title: 'common-ui/components/Tabs',
    component: Component,
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tabs: Story = {
    args: {
        defaultTabId: 'tab1',
        tabs: [
            { id: 'tab1', label: 'Tab 1', content: 'Content for Tab 1' },
            { id: 'tab2', label: 'Tab 2', content: 'Content for Tab 2' },
            { id: 'tab3', label: 'Tab 3', content: <>
                <em>HTML</em>
                {' '}
                content for
                {' '}
                <b>tab 3</b>
            </> },
        ],
    },
};

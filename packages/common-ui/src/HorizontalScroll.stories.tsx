import { HorizontalScroll as Component } from './HorizontalScroll';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
    title: 'common-ui/HorizontalScroll',
    component: Component,
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HorizontalScroll: Story = {
    args: {
        contentRender: <ul />,
        children: (
            <>
                {Array.from({ length: 20 }).map((_, i) => (
                    <li key={i}>
                        Item
                        {' '}
                        {i + 1}
                    </li>
                ))}
            </>
        ),
    },
};

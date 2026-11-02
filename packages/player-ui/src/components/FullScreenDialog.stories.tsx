import { Button } from 'common-ui/components/Button';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { FullScreenDialog as Component } from './FullScreenDialog';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
    title: 'player-ui/Full Screen Dialog',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        title: 'Full screen',
        isOpen: true,
        setOpen: fn(),
        children: Array.from({ length: 40 }, (_, index) => <p key={index}>{`Scrolling content line ${index + 1}`}</p>),
    },
    render: (args) => {
        const [isOpen, setOpen] = useState(args.isOpen);

        return (
            <>
                <Button onClick={() => setOpen(true)}>Open</Button>

                <Component
                    {...args}
                    isOpen={isOpen}
                    setOpen={(open) => {
                        setOpen(open);
                        args.setOpen(open);
                    }}
                />
            </>
        );
    },
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullScreenDialog: Story = {};

import { fn } from 'storybook/test';
import { CardChoiceToDraw } from './CardChoiceToDraw';
import { DragCardProvider } from './DragCardProvider';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof CardChoiceToDraw> = {
    title: 'player-ui/Card Choice to Draw',
    component: CardChoiceToDraw,
    parameters: {
        layout: 'fullscreen',
    },
    render: (args) => {
        const handleCardDropped = (cardId: number, targetId: string | null) => {
            console.log(`dropped card ${cardId} on target ${targetId}`);
            fn();
        };

        return (
            <DragCardProvider onCardDropped={handleCardDropped}>
                <div style={{ height: '100dvh', display: 'flex' }}>
                    <CardChoiceToDraw {...args} />
                </div>
            </DragCardProvider>
        );
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Three: Story = {
    args: {
        cards: [
            { id: 1, type: 'faceTarget' },
            { id: 2, type: 'strafe' },
            { id: 3, type: 'slowAndSteady' },
        ],
    },
};

export const Two: Story = {
    args: {
        cards: [
            { id: 1, type: 'sweepLeft' },
            { id: 2, type: 'sweepRight' },
        ],
    },
};

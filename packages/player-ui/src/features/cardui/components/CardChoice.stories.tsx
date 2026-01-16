import { fn } from 'storybook/test';
import { CardChoice } from './CardChoice';
import { CardDropTarget } from './CardDropTarget';
import { DragCardProvider } from './DragCardProvider';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof CardChoice> = {
    title: 'player-ui/Card Choice',
    component: CardChoice,
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
                    <CardChoice {...args} />

                    <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', maxWidth: 'calc(100vw - 20em)', flexWrap: 'wrap', gap: '3em' }}>
                        <CardDropTarget
                            id="location-drop"
                            targetType="location"
                        >
                            Location drop
                        </CardDropTarget>
                        <CardDropTarget
                            id="enemy-drop"
                            targetType="enemy"
                        >
                            Enemy drop
                        </CardDropTarget>
                        <CardDropTarget
                            id="system-drop"
                            targetType="system"
                        >
                            System drop
                        </CardDropTarget>
                        <CardDropTarget
                            id="weapon-slot-drop"
                            targetType="weapon-slot"
                        >
                            Weapon slot drop
                        </CardDropTarget>
                        <CardDropTarget
                            id="weapon-drop"
                            targetType="weapon"
                        >
                            Weapon drop
                        </CardDropTarget>
                    </div>
                </div>
            </DragCardProvider>
        );
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Three: Story = {
    args: {
        cardId: 1,
        cardTypes: [
            'faceTarget',
            'strafe',
            'slowAndSteady',
        ],
    },
};

export const Two: Story = {
    args: {
        cardId: 1,
        cardTypes: [
            'sweepLeft',
            'sweepRight',
        ],
    },
};

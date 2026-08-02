import { DeflectorDisplay as Component } from './DeflectorDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Science/Deflector',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Deflector: Story = {
    args: {
        modifierSlot: null,
        substanceSlot: 'tetryonScan',
        deliverySlot: 'scanPulse',
        availablePower: 3,
        deflectorCard: {
            id: 4,
            type: 'deflectorCoherentTetryonPulse',
        },
    },
};

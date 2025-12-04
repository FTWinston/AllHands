import { Cooldown } from 'common-data/types/Cooldown';
import { default as ExampleIcon } from 'common-ui/icons/exampleIcon.svg?react';
import { useEffect, useState } from 'react';
import { EffectIndicator as Component } from './EffectIndicator';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Engineer/EffectIndicator',
    component: Component,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Permanent: Story = {
    args: {
        positive: true,
        icon: ExampleIcon,
        name: 'Permanent effect',
        description: <>An effect that has no duration, so it lasts indefinitely.</>,
        duration: { startTime: Date.now(), endTime: Date.now() + 30000 } as Cooldown,
    },
};

export const FixedFraction: Story = {
    args: {
        positive: false,
        icon: ExampleIcon,
        name: 'Fractional effect',
        description: <>An effect that starts half way through a very long duration, so it essentially doesn't animate.</>,
        duration: { startTime: Date.now() - 5000000, endTime: Date.now() + 5000000 } as Cooldown,
    },
};

export const Cyclic: Story = {
    args: {
        positive: false,
        icon: ExampleIcon,
        name: 'Cyclic effect',
        description: <>An effect that lasts a short duration, toggles off, then on again.</>,
    },
    render: (args) => {
        const [duration, setDuration] = useState<Cooldown | undefined>();
        const [hidden, setHidden] = useState(true);

        useEffect(() => {
            const interval = setInterval(async () => {
                const startTime = Date.now();
                const endTime = startTime + 4000;
                setHidden(false);
                setDuration({ startTime, endTime });
                await new Promise(resolve => setTimeout(resolve, 4000));
                setHidden(true);
            }, 6000);

            return () => clearInterval(interval);
        }, []);

        return (
            <Component
                {...args}
                duration={duration}
                hidden={hidden}
            />
        );
    },
};

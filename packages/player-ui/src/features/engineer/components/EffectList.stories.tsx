import { SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { Cooldown } from 'common-data/types/Cooldown';
import { Button } from 'common-ui/components/Button';
import { useState } from 'react';
import { EffectList as Component } from './EffectList';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Engineer/EffectList',
    component: Component,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const EffectList: Story = {
    args: {
        effects: [
            {
                type: 'something1',
                progress: { startTime: Date.now(), endTime: Date.now() + 30000 } as Cooldown,
            },
            {
                type: 'something2',
                progress: { startTime: Date.now() - 5000000, endTime: Date.now() + 5000000 } as Cooldown,
            },
        ],
    },
    render: (args) => {
        const [effects, setEffects] = useState(args.effects ?? []);
        const [nextId, setNextId] = useState((args.effects?.length ?? 0) + 1);

        return (
            <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <Button onClick={() => {
                        const newEffect = {
                            type: `something${nextId}` as SystemEffectType,
                            progress: { startTime: Date.now(), endTime: Date.now() + 5000 } as Cooldown,
                        };
                        setEffects([...effects, newEffect]);
                        setNextId(nextId + 1);
                    }}
                    >
                        Add Effect
                    </Button>
                    <Button onClick={() => {
                        setEffects(() => {
                            if (effects.length === 0) {
                                return effects;
                            }
                            const idx = Math.floor(Math.random() * effects.length);
                            return effects.filter((_, i) => i !== idx);
                        });
                    }}
                    >
                        Remove Effect
                    </Button>
                </div>

                <Component
                    {...args}
                    effects={effects}
                />
            </div>
        );
    },
};

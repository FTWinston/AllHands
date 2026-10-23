import { FC, useState } from 'react';
import { Button } from '../../components/Button';
import { sounds } from './sounds';
import { useBridgeChatter } from './useBridgeChatter';
import { HumIntensity, useHum } from './useHum';
import type { Meta, StoryObj } from '@storybook/react-vite';

/** Every sound in the game, to audition them side by side. */
const Component: FC = () => {
    const [humIntensity, setHumIntensity] = useState<HumIntensity>(0);
    const [chatter, setChatter] = useState(false);
    useHum(humIntensity);
    useBridgeChatter(chatter);

    const playable: Record<string, () => void> = {
        ...sounds,
        beamFired: () => sounds.beamFired(true),
        enemyBeamFired: () => sounds.beamFired(false),
        projectileFired: () => sounds.projectileFired(true),
        enemyProjectileFired: () => sounds.projectileFired(false),
        shipHit: () => sounds.shipHit(0),
        bigShipHit: () => sounds.shipHit(5),
    };

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5em' }}>
            {Object.entries(playable).map(([name, play]) => (
                <Button key={name} onClick={play}>{name}</Button>
            ))}
            <Button palette="energy" onClick={() => setHumIntensity(intensity => ((intensity + 1) % 3) as HumIntensity)}>
                {`hum: ${humIntensity}`}
            </Button>
            <Button palette="energy" onClick={() => setChatter(value => !value)}>
                {`bridge chatter: ${chatter ? 'on' : 'off'}`}
            </Button>
        </div>
    );
};

const meta = {
    title: 'common-ui/features/sound/Sound Board',
    component: Component,
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SoundBoard: Story = {};

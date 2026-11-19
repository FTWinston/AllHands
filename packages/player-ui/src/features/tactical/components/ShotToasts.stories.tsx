import { useEffect, useState } from 'react';
import { addShotResult, ShotOutcomeInfo, ShotResult, shotResultLifetime } from '../utils/shotResults';
import { ShotToasts as Component } from './ShotToasts';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Tactical/Shot Toasts',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        currentTargetId: 'target1',
        getTargetName: id => (id === 'target2' ? 'Raider 2' : 'Raider 1'),
        persistent: true,
    },
    // The toasts stack up from the bottom edge of the area above them, so give them some room.
    decorators: [
        Story => (
            <div style={{ height: '30dvh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const result = (extra: Partial<ShotResult>): ShotResult => ({ id: 1, outcome: 'hit', targetId: 'target1', count: 1, expiresAt: Infinity, ...extra });

export const Hit: Story = {
    args: { results: [result({ system: 'helm' })] },
};

export const Miss: Story = {
    args: { results: [result({ outcome: 'miss' })] },
};

export const AbsorbedByShields: Story = {
    args: { results: [result({ outcome: 'absorbed' })] },
};

/** A result for a target other than the one being shown names it. */
export const OtherTarget: Story = {
    args: { results: [result({ outcome: 'miss', targetId: 'target2' })] },
};

/** A shot every 300ms, in a mix of outcomes: the same outcome twice in a row adds to the one toast, rather than flickering a new one in. Each fades out as it expires. */
export const QuickVolley: Story = {
    render: (args) => {
        const [results, setResults] = useState<ShotResult[]>([]);

        useEffect(() => {
            const outcomes: ShotOutcomeInfo[] = [
                { outcome: 'hit', targetId: 'target1', system: 'helm' },
                { outcome: 'hit', targetId: 'target1', system: 'helm' },
                { outcome: 'miss', targetId: 'target1' },
                { outcome: 'hit', targetId: 'target1', system: 'tactical' },
                { outcome: 'absorbed', targetId: 'target1' },
                { outcome: 'hit', targetId: 'target2', system: 'hull' },
            ];
            let nextId = 0;
            const interval = setInterval(() => {
                const id = nextId++;
                setResults(current => addShotResult(current, outcomes[id % outcomes.length], Date.now(), id));
            }, 300);

            return () => clearInterval(interval);
        }, []);

        // Results are kept a little past their lifetime here, as the toasts fade by themselves.
        useEffect(() => {
            const timeout = setTimeout(() => setResults(current => current.filter(r => r.expiresAt > Date.now())), shotResultLifetime + 50);
            return () => clearTimeout(timeout);
        }, [results]);

        return <Component {...args} persistent={false} results={results} />;
    },
};

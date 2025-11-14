import { Meta, StoryObj } from '@storybook/react';
import { Vulnerability } from 'common-types';
import crewStyles from 'common-ui/CrewColors.module.css';
import { useState } from 'react';
import { Target as Component } from './Target';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Tactical/Target',
    component: Component,
    render: (args) => {
        const [selectedVulnerability, setSelectedVulnerability] = useState<Vulnerability | null>(args.selectedVulnerability);

        return (
            <ul className={crewStyles.tactical}>
                <Component
                    {...args}
                    selectedVulnerability={selectedVulnerability}
                    selectVulnerability={setSelectedVulnerability}
                />
            </ul>
        );
    },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Target: Story = {
    args: {
        id: 'Enemy-01',
        appearance: 'starfighter',
        targetNumber: 1,
        totalTargets: 3,
        selectedVulnerability: null,
        vulnerabilities: ['shields', 'engine'],
    },
};

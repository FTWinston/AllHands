import { SalvageDisplay as Component } from './SalvageDisplay';
import { ViewscreenPhaseDisplay } from './ViewscreenPhaseDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { SectorMapInfo } from 'common-data/features/sectors/types/SectorMapInfo';

const map: SectorMapInfo = {
    sectorName: 'The Frontier',
    sectorIndex: 0,
    sectorCount: 3,
    nodes: [
        { id: 'start', kind: 'outfitting', name: 'Outfitting Station', gridReference: 'A1', x: 0, y: 0.5, elite: false, next: ['a', 'b'] },
        { id: 'a', kind: 'combat', name: 'Skirmish', gridReference: 'B1', x: 0.5, y: 0, elite: false, next: ['boss'] },
        { id: 'b', kind: 'combat', name: 'Ambush', gridReference: 'B2', x: 0.5, y: 1, elite: true, next: ['boss'] },
        { id: 'boss', kind: 'boss', name: 'Placeholder Boss A', gridReference: 'C1', x: 1, y: 0.5, elite: false, next: [] },
    ],
    currentNodeId: 'a',
    visitedNodeIds: ['start', 'a'],
    availableNodeIds: ['boss'],
};

const meta: Meta<typeof Component> = {
    title: 'game-ui/Salvage Display',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    // Over the sector map, as on the viewscreen once the ship has warped away from the fight.
    render: args => (
        <ViewscreenPhaseDisplay phase="map" outcome={null} map={map} message={null} antimatter={40} showMenu={() => {}}>
            <Component {...args} />
        </ViewscreenPhaseDisplay>
    ),
    args: {
        chooser: 'science',
        cards: [
            { role: 'helm', card: { id: 401, type: 'burn' }, deckSize: 9, maxDeckSize: 12 },
            { role: 'tactical', card: { id: 402, type: 'quantumTorpedo' }, deckSize: 12, maxDeckSize: 12 },
            { role: 'engineer', card: { id: 403, type: 'trickleCharge' }, deckSize: 8, maxDeckSize: 12 },
        ],
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ScienceChooses: Story = {};

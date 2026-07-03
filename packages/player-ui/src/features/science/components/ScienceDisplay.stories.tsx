import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { fn } from 'storybook/test';
import { useFakePowerAndCards } from '../../engineer/components/EngineerDisplay.stories';
import { ScienceDisplay as Component } from './ScienceDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'player-ui/Science/UI',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        onPause: fn(),
        targets: [],
        modifierSlot: null,
        substanceSlot: null,
        deliverySlot: null,
        deflectorCard: null,
        viewer: { shipId: null, faction: 'player', relations: { raiders: RelationshipType.Hostile } },
    },
    render: (args) => {
        const { cards, expendCard, cardGeneration } = useFakePowerAndCards({
            ...args,
            cards: args.cards || [],
            createCard: (id: number) => ({
                id,
                type: 'exampleNoTarget',
            }),
        });

        return (
            <Component
                {...args}
                cardGeneration={cardGeneration}
                maxHandSize={args.maxHandSize}
                cards={cards}
                playCard={(cardId, targetType, targetId) => {
                    console.log(`dropped card ${cardId} on ${targetType} ${targetId}`);
                    expendCard(cardId);
                }}
            />
        );
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const UI: Story = {
    args: {
        cards: [
            {
                id: 1,
                type: 'scan',
            },
            {
                id: 2,
                type: 'scan',
            },
            {
                id: 3,
                type: 'exampleNoTarget',
            },
        ],
        systemOrderByTarget: {
            target1: { order: [3, 2, 0, 4] },
        },
        scannedShipId: 'target1',
        scannedHelm: {
            targetId: 'target1',
            activeManeuver: null,
            evasionChance: 0,
        },
        targets: [
            {
                id: 'target1',
                name: 'Enemy Ship 1',
                appearance: 'scout',
                faction: 'raiders',
                motion: [
                    { time: 0, x: 100, y: 100, angle: 0 },
                    { time: 1000, x: 200, y: 100, angle: 0 },
                ],
            },
            {
                id: 'target2',
                name: 'Enemy Ship 2',
                appearance: 'starfighter',
                faction: 'raiders',
                motion: [
                    { time: 0, x: -100, y: 100, angle: 0 },
                    { time: 1000, x: 100, y: -100, angle: 0 },
                ],
            },
            {
                id: 'target3',
                name: 'Enemy Ship 3',
                appearance: 'satellite',
                faction: 'raiders',
                motion: [
                    { time: 0, x: 100, y: 100, angle: 0 },
                    { time: 1000, x: 200, y: 100, angle: 0 },
                ],
            },
            {
                id: 'target4',
                name: 'Enemy Ship 4',
                appearance: 'interceptor',
                faction: 'raiders',
                motion: [
                    { time: 0, x: -100, y: 100, angle: 0 },
                    { time: 1000, x: 100, y: -100, angle: 0 },
                ],
            },
            {
                id: 'target5',
                name: 'Enemy Ship 5',
                appearance: 'spaceship',
                faction: 'raiders',
                motion: [
                    { time: 0, x: -100, y: 100, angle: 0 },
                    { time: 1000, x: 100, y: -100, angle: 0 },
                ],
            },
        ],
        power: 5,
        maxHandSize: 5,
    },
};

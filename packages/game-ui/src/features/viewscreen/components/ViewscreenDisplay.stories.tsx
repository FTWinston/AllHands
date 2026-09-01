import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { Keyframes } from 'common-data/features/space/types/Keyframes';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { useLoopingKeyframes } from 'common-ui/hooks/useLoopingKeyframes';
import { useWeaponEffects } from 'common-ui/hooks/useWeaponEffects';
import { useMemo, useState } from 'react';
import { fn } from 'storybook/test';
import { ViewscreenDisplay as Component } from './ViewscreenDisplay';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta<typeof Component> = {
    title: 'game-ui/Viewscreen Display',
    component: Component,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        showMenu: fn(),
    },
    render: (args) => {
        const [center, setCenter] = useState<Keyframes<Vector2D>>(() => ([
            { time: Date.now(), x: 0, y: 0 },
            { time: Date.now() + 5000, x: 5, y: 0 },
            { time: Date.now() + 10000, x: 5, y: 5 },
            { time: Date.now() + 15000, x: 0, y: 5 },
        ]));

        useLoopingKeyframes<Vector2D>(setCenter, 20000);

        const weaponEffectsRef = useWeaponEffects(null);

        return (
            <Component
                {...args}
                center={center}
                viewer={{ shipId: null, faction: null, relations: null }}
                weaponEffectsRef={weaponEffectsRef}
            />
        );
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const UI: Story = {
    args: {
        objects: {},
    },
};

export const WithWeaponArcs: Story = {
    render: (args) => {
        const weaponEffectsRef = useWeaponEffects(null);

        // Cast is needed because `objects` here also carries the tacticalState/scienceState
        // fields that a real ship's GameObjectInfo would only expose via ShipInfo.
        const objects = useMemo(() => ({
            player: {
                id: 'player',
                name: 'Player',
                appearance: 'chevron',
                faction: 'player',
                motion: [
                    { time: Date.now(), x: 0, y: 0, angle: 0 },
                    { time: Date.now() + 5000, x: 5, y: 0, angle: Math.PI / 4 },
                    { time: Date.now() + 10000, x: 5, y: 5, angle: Math.PI / 2 },
                    { time: Date.now() + 15000, x: 0, y: 5, angle: (3 * Math.PI) / 4 },
                ],
                tacticalState: {
                    slots: [
                        { card: { id: 1, type: 'phaserCannon' } },
                        { card: { id: 2, type: 'photonTorpedo' } },
                    ],
                },
                scienceState: {
                    scannedTactical: {
                        targetId: 'enemy',
                        weaponSlots: [
                            { card: { id: 3, type: 'phaserStrip' } },
                        ],
                    },
                },
            },
            enemy: {
                id: 'enemy',
                name: 'Enemy',
                appearance: 'spaceship',
                faction: 'raiders',
                motion: [{ time: Date.now(), x: 6, y: -3, angle: Math.PI }],
            },
        }), []) as unknown as Record<string, GameObjectInfo>;

        return (
            <Component
                {...args}
                center={[{ time: Date.now(), x: 0, y: 0 }]}
                objects={objects}
                viewer={{ shipId: 'player', faction: 'player', relations: null }}
                weaponEffectsRef={weaponEffectsRef}
            />
        );
    },
};

import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { Keyframes } from 'common-data/features/space/types/Keyframes';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { WeaponEffect, projectileFlightTime } from 'common-data/features/space/types/WeaponEffect';
import { interpolatePosition } from 'common-data/features/space/utils/interpolate';
import { useLoopingKeyframes } from 'common-ui/hooks/useLoopingKeyframes';
import { useWeaponEffects } from 'common-ui/hooks/useWeaponEffects';
import { ComponentProps, RefObject, useEffect, useMemo, useState } from 'react';
import { fn } from 'storybook/test';
import { setCombatLabels } from '../utils/combatEffectSettings';
import { LowHullWarning } from './LowHullWarning';
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

/** Red alert: the hull is close to failing. */
export const HullCritical: Story = {
    args: {
        objects: {},
        children: <LowHullWarning health={18} maxHealth={100} />,
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
                appearance: 'hammerhead-cruiser',
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

const cruiserPosition = { x: -8, y: -4 };

const combatTime = Date.now();

/** Everything drifts along together, slowly enough to stay on screen for as long as anyone's watching. */
function drift(x: number, y: number, angle: number) {
    return [
        { time: combatTime, x, y, angle },
        { time: combatTime + 3600000, x: x + 3600 * Math.cos(angle), y: y - 3600 * Math.sin(angle), angle },
    ];
}

const combatObjects = {
    player: { id: 'player', name: 'Player', appearance: 'chevron', faction: 'player', motion: drift(0, 0, 0) },
    raider: { id: 'raider', name: 'Raider', appearance: 'trident-raider', faction: 'raiders', motion: drift(8, 4, 0) },
    cruiser: { id: 'cruiser', name: 'Cruiser', appearance: 'hammerhead-cruiser', faction: 'raiders', motion: drift(cruiserPosition.x, cruiserPosition.y, 0) },
    fighter: { id: 'fighter', name: 'Fighter', appearance: 'dart-fighter', faction: 'raiders', motion: drift(7, -5, 0) },
} as unknown as Record<string, GameObjectInfo>;

type Shot = [weapon: string, source: string, target: string, damage: number | 'miss' | 'none'];

/** One of everything that can happen, in a loop. */
const combatScript: Shot[] = [
    ['phaserCannon', 'player', 'raider', 0],
    ['phaserStrip', 'raider', 'player', 0],
    ['photonTorpedo', 'player', 'cruiser', 0],
    ['quantumTorpedo', 'cruiser', 'player', 6],
    ['phaserStrip', 'player', 'fighter', 'miss'],
    ['photonicCannon', 'player', 'raider', 5],
    ['photonTorpedo', 'player', 'raider', 'miss'],
    ['deflectorPhasedPolaronBeam', 'player', 'cruiser', 'none'],
    ['deflectorCoherentTetryonPulse', 'player', 'raider', 'none'],
    ['deflectorInvertedAntiprotonBurst', 'player', 'fighter', 'none'],
    ['deflectorModulatedGravitonField', 'player', 'cruiser', 'none'],
];

function useScriptedCombat(effects: RefObject<WeaponEffect[]>) {
    useEffect(() => {
        let step = 0;

        const interval = setInterval(() => {
            const now = Date.now();

            if (step === combatScript.length) {
                step = 0;
                effects.current.push({
                    type: 'explosion',
                    sourceId: 'wreck',
                    appearance: 'wedge-destroyer',
                    position: { x: (now - combatTime) / 1000 - 9, y: 6, angle: 0.5 },
                    startTime: now,
                });
                return;
            }

            const [weapon, sourceId, targetId, damage] = combatScript[step++];

            effects.current.push({ type: 'shot', weapon, sourceId, targetId, missed: damage === 'miss' || undefined, startTime: now });

            if (typeof damage === 'number') {
                const flightTime = weapon.endsWith('Torpedo') ? projectileFlightTime : 0;
                effects.current.push({ type: 'impact', sourceId, targetId, damage, startTime: now + flightTime });
            }
        }, 1800);

        return () => clearInterval(interval);
    }, [effects]);
}

const CombatStory = ({ showLabels, ...args }: ComponentProps<typeof Component> & { showLabels: boolean }) => {
    const weaponEffectsRef = useWeaponEffects(null);
    useScriptedCombat(weaponEffectsRef);

    useEffect(() => setCombatLabels(showLabels), [showLabels]);

    return (
        <Component
            {...args}
            center={[{ time: combatTime, x: 0, y: 0 }, { time: combatTime + 3600000, x: 3600, y: 0 }]}
            objects={combatObjects}
            viewer={{ shipId: 'player', faction: 'player', relations: { raiders: RelationshipType.Hostile } }}
            weaponEffectsRef={weaponEffectsRef}
        />
    );
};

/** A fight, with one of everything: hits on shields and on the hull, misses, deflectors, and an explosion. */
export const Combat: Story = {
    render: args => <CombatStory {...args} showLabels={false} />,
};

/** The same fight, with the optional labels saying what's going on. */
export const CombatWithLabels: Story = {
    render: args => <CombatStory {...args} showLabels />,
};

const warpOrder = ['fighter', 'cruiser', 'player'];

function useScriptedWarps(effects: RefObject<WeaponEffect[]>) {
    useEffect(() => {
        let step = 0;

        const interval = setInterval(() => {
            const now = Date.now();
            const ship = combatObjects[warpOrder[step++ % warpOrder.length]];

            effects.current.push({
                type: 'warpOut',
                sourceId: ship.id,
                appearance: ship.appearance,
                position: interpolatePosition(ship.motion, now),
                startTime: now,
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [effects]);
}

const WarpOutStory = (args: ComponentProps<typeof Component>) => {
    const weaponEffectsRef = useWeaponEffects(null);
    useScriptedWarps(weaponEffectsRef);

    useEffect(() => setCombatLabels(true), []);

    return (
        <Component
            {...args}
            center={[{ time: combatTime, x: 0, y: 0 }, { time: combatTime + 3600000, x: 3600, y: 0 }]}
            objects={combatObjects}
            viewer={{ shipId: 'player', faction: 'player', relations: { raiders: RelationshipType.Hostile } }}
            weaponEffectsRef={weaponEffectsRef}
        />
    );
};

/**
 * Ships jumping to warp in turn: a small one, a big one, then our own. Each is hidden once it goes.
 * In the game it would then be gone for good, but here it's still there, so it comes back for the next round.
 */
export const WarpOut: Story = {
    render: args => <WarpOutStory {...args} />,
};

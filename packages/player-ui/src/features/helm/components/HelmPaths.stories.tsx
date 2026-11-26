import { DndContext } from '@dnd-kit/core';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { GameObjectInfo, RelationshipViewer } from 'common-data/features/space/types/GameObjectInfo';
import { Keyframes } from 'common-data/features/space/types/Keyframes';
import { Position } from 'common-data/features/space/types/Position';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { useWeaponEffects } from 'common-ui/hooks/useWeaponEffects';
import { ActiveCardContext } from 'src/features/cardui/components/DragCardProvider';
import { fn } from 'storybook/test';
import { HelmSpaceMap as Component } from './HelmSpaceMap';
import type { Meta, StoryObj } from '@storybook/react-vite';

/** The player's ship sitting at the origin, facing +x. */
const still: Keyframes<Position> = [{ time: 0, x: 0, y: 0, angle: 0 }];

/** The player's ship flying along +x at 1.5 units a second, for a long while either side of now. */
const now = Date.now();
const moving: Keyframes<Position> = [
    { time: now - 60_000, x: -90, y: 0, angle: 0 },
    { time: now + 60_000, x: 90, y: 0, angle: 0 },
];

const raider: GameObjectInfo = {
    id: 'raider',
    name: 'Raider',
    appearance: 'kite-scout',
    faction: 'raiders',
    motion: [{ time: 0, x: 3, y: -4, angle: Math.PI }],
};

const viewer: RelationshipViewer = { shipId: 'playerShip', faction: 'player', relations: { raiders: RelationshipType.Hostile } };

type StoryArgs = {
    /** The card being dragged. */
    cardType: CardType;
    /** The hexagon it's over, as its "x,y" world position. Evasive patterns don't need one. */
    overTargetId: string | null;
    /** Whether the player's ship is flying along +x, rather than sitting still. */
    isMoving?: boolean;
    momentumLevel?: number;
};

/** The path the helm map previews while a maneuver card is dragged over a hexagon, set directly rather than by dragging. A raider sits ahead and to one side. */
const meta: Meta<StoryArgs> = {
    title: 'player-ui/Helm/Paths',
    parameters: {
        layout: 'fullscreen',
    },
    render: ({ cardType, overTargetId, isMoving, momentumLevel }) => {
        const weaponEffectsRef = useWeaponEffects(null);
        const motion = isMoving ? moving : still;
        const objects: Record<string, GameObjectInfo> = {
            playerShip: { id: 'playerShip', name: 'Player', appearance: 'chevron', faction: 'player', motion },
            raider,
        };

        return (
            <DndContext>
                <ActiveCardContext.Provider
                    value={{
                        activeCard: { id: 1, targetType: overTargetId ? 'location' : 'no-target', cardType },
                        droppedCard: null,
                        overTargetId,
                        dragDisplayMode: 'none',
                    }}
                >
                    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
                        <Component
                            center={motion}
                            objects={objects}
                            viewer={viewer}
                            cancelManeuver={fn()}
                            weaponEffectsRef={weaponEffectsRef}
                            momentumLevel={momentumLevel}
                        />
                    </div>
                </ActiveCardContext.Provider>
            </DndContext>
        );
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ZigZagShort: Story = { args: { cardType: 'zigZag', overTargetId: '4.500,0.866' } };
export const ZigZagLong: Story = { args: { cardType: 'zigZag', overTargetId: '9.000,0.000' } };
export const SweepLeft: Story = { args: { cardType: 'sweepLeft', overTargetId: '6.000,-3.464' } };
export const SweepRight: Story = { args: { cardType: 'sweepRight', overTargetId: '6.000,3.464' } };
export const SharpTurn: Story = { args: { cardType: 'sharpTurn', overTargetId: '4.500,6.062' } };
export const SharpTurnBehind: Story = { args: { cardType: 'sharpTurn', overTargetId: '-3.000,3.464' } };
export const Broadside: Story = { args: { cardType: 'broadside', overTargetId: '7.500,0.866' } };
export const BroadsideBehind: Story = { args: { cardType: 'broadside', overTargetId: '-6.000,3.464' } };
export const PunchIt: Story = { args: { cardType: 'punchIt', overTargetId: '7.500,2.598' } };
export const Slingshot: Story = { args: { cardType: 'slingshot', overTargetId: '-3.000,-3.464' } };
export const BackAway: Story = { args: { cardType: 'backAway', overTargetId: '-4.500,0.866' } };
export const Drift: Story = { args: { cardType: 'drift', overTargetId: '3.000,-3.464', isMoving: true, momentumLevel: 4 } };
export const Overdrive: Story = { args: { cardType: 'overdrive', overTargetId: '9.000,0.000' } };
export const Hairpin: Story = { args: { cardType: 'hairpin', overTargetId: null, momentumLevel: 3 } };
export const Juke: Story = { args: { cardType: 'juke', overTargetId: null, momentumLevel: 2 } };
export const PatternAlpha: Story = { args: { cardType: 'patternAlpha', overTargetId: null } };
export const PatternBeta: Story = { args: { cardType: 'patternBeta', overTargetId: null } };
export const PatternGamma: Story = { args: { cardType: 'patternGamma', overTargetId: null } };

import { DndContext } from '@dnd-kit/core';
import { GameObjectInfo, RelationshipViewer } from 'common-data/features/space/types/GameObjectInfo';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { useWeaponEffects } from 'common-ui/hooks/useWeaponEffects';
import { ActiveCardContext } from 'src/features/cardui/components/DragCardProvider';
import { fn } from 'storybook/test';
import { HelmSpaceMap as Component } from './HelmSpaceMap';
import type { Meta, StoryObj } from '@storybook/react-vite';

const objects: Record<string, GameObjectInfo> = {
    playerShip: {
        id: 'playerShip',
        name: 'Player',
        appearance: 'chevron',
        faction: 'player',
        motion: [{ time: 0, x: 0, y: 0, angle: 0 }],
    },
    raider: {
        id: 'raider',
        name: 'Raider',
        appearance: 'kite-scout',
        faction: 'raiders',
        motion: [{ time: 0, x: 4, y: -3, angle: Math.PI }],
    },
    ally: {
        id: 'ally',
        name: 'Ally',
        appearance: 'chevron',
        faction: 'player',
        motion: [{ time: 0, x: -3, y: 4, angle: 0 }],
    },
};

const viewer: RelationshipViewer = { shipId: 'playerShip', faction: 'player', relations: { raiders: RelationshipType.Hostile } };

type StoryArgs = {
    /** The hexagon that the dragged Match Course card is over, as its "x,y" world position. */
    overTargetId: string | null;
};

/**
 * The helm map while a Match Course card is being dragged over a hexagon, set directly rather than by dragging:
 * the eligible ship nearest that hexagon is ringed, with lines to it from the player's ship and from the hexagon.
 */
const meta: Meta<StoryArgs> = {
    title: 'player-ui/Helm/Ship Target',
    parameters: {
        layout: 'fullscreen',
    },
    render: ({ overTargetId }) => {
        const weaponEffectsRef = useWeaponEffects(null);

        return (
            <DndContext>
                <ActiveCardContext.Provider
                    value={{
                        activeCard: { id: 1, targetType: 'ship', cardType: 'matchCourse' },
                        droppedCard: null,
                        overTargetId,
                        dragDisplayMode: 'none',
                    }}
                >
                    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
                        <Component
                            center={objects.playerShip.motion}
                            objects={objects}
                            viewer={viewer}
                            cancelManeuver={fn()}
                            weaponEffectsRef={weaponEffectsRef}
                        />
                    </div>
                </ActiveCardContext.Provider>
            </DndContext>
        );
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const NearHostileShip: Story = {
    args: {
        overTargetId: '3.000,-1.732',
    },
};

export const NearFriendlyShip: Story = {
    args: {
        overTargetId: '-1.500,2.598',
    },
};

export const NotOverAHexagon: Story = {
    args: {
        overTargetId: null,
    },
};

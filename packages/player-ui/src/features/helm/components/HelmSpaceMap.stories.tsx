import { DndContext } from '@dnd-kit/core';
import { FieldInfo } from 'common-data/features/space/types/FieldInfo';
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
    /** The lingering zones that deflectors have left. */
    fields?: Record<string, FieldInfo>;
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
    render: ({ overTargetId, fields }) => {
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
                            fields={fields}
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

/** Never expires, as far as a story is concerned. */
const endTime = Number.MAX_SAFE_INTEGER;

/** Two zones of different substances, one hostile with the raider in it, and one friendly (dashed) with the ally in it, both with their long axis along the line between the ships. */
export const WithFields: Story = {
    args: {
        overTargetId: null,
        fields: {
            hostile: { id: 'hostile', x: 4, y: -3, angle: -Math.atan2(-3, 4), radiusX: 4, radiusY: 2.5, endTime, substance: 'Antiproton', friendly: false },
            friendly: { id: 'friendly', x: -3, y: 4, angle: Math.PI / 2, radiusX: 4, radiusY: 2.5, endTime, substance: 'Chroniton', friendly: true },
        },
    },
};

/** A false contact that the player's ship left, flying on where the ship is going. It's the player's ship to the raider, with nothing to tell them it isn't. */
const ghost = { id: 'ghost', name: 'Player', appearance: 'chevron', faction: 'player', motion: [{ time: 0, x: -1, y: 3, angle: 0 }] } as const;

/** What the helm map shows of the ghost, which is only the ghost's own side that knows is one: drawn see-through, dashed and labelled. */
function ghostStory(objectsInView: Record<string, GameObjectInfo>, viewerInView: RelationshipViewer, centreOn: string): Story {
    return {
        args: { overTargetId: null },
        render: () => {
            const weaponEffectsRef = useWeaponEffects(null);

            return (
                <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
                    <Component
                        center={objectsInView[centreOn].motion}
                        objects={objectsInView}
                        viewer={viewerInView}
                        cancelManeuver={fn()}
                        weaponEffectsRef={weaponEffectsRef}
                    />
                </div>
            );
        },
    };
}

/** The player's helm: the ghost is drawn as a ghost, see-through, with a dashed outline, and labelled. */
export const SensorGhostSeenByItsOwnSide: Story = ghostStory(
    { ...objects, ghost: { ...ghost, isSensorGhost: true } },
    viewer,
    'playerShip'
);

/** The raider's helm: the ghost is a ship like any other hostile one. */
export const SensorGhostSeenByAnEnemy: Story = ghostStory(
    { ...objects, ghost },
    { shipId: 'raider', faction: 'raiders', relations: { player: RelationshipType.Hostile } },
    'raider'
);

/** Two raiders that share a name, which the crew tells apart by label. */
const twinObjects: Record<string, GameObjectInfo> = {
    ...objects,
    raider: { ...objects.raider, name: 'Raider' },
    twin: { id: 'twin', name: 'Raider', appearance: 'kite-scout', faction: 'raiders', motion: [{ time: 0, x: 3, y: 3, angle: Math.PI }] },
    // Well off the map, so a crew targeting them gets an arrow at its edge rather than a reticle.
    farRaider: { id: 'farRaider', name: 'Raider', appearance: 'kite-scout', faction: 'raiders', motion: [{ time: 0, x: 40, y: -14, angle: Math.PI }] },
    farTwin: { id: 'farTwin', name: 'Raider', appearance: 'kite-scout', faction: 'raiders', motion: [{ time: 0, x: -25, y: 30, angle: 0 }] },
};
const contactLabels = { raider: 'Alpha', twin: 'Bravo', ally: 'Charlie', farRaider: 'Delta', farTwin: 'Echo' };

function reticleStory(tacticalTargetId: string | undefined, scienceTargetId: string | undefined): Story {
    return {
        args: { overTargetId: null },
        render: () => {
            const weaponEffectsRef = useWeaponEffects(null);

            return (
                <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
                    <Component
                        center={twinObjects.playerShip.motion}
                        objects={twinObjects}
                        viewer={viewer}
                        contactLabels={contactLabels}
                        tacticalTargetId={tacticalTargetId}
                        scienceTargetId={scienceTargetId}
                        cancelManeuver={fn()}
                        weaponEffectsRef={weaponEffectsRef}
                    />
                </div>
            );
        },
    };
}

/** Every contact is labelled, though two of them share a name. Nothing is targeted. */
export const ContactLabels: Story = reticleStory(undefined, undefined);

/** Tactical (yellow brackets) is aiming at one raider, and science (blue ring) is scanning the other. */
export const TargetedByTacticalAndScience: Story = reticleStory('raider', 'twin');

/** Both crews are on the same contact, so it has both reticles, one inside the other. */
export const SameContactTargeted: Story = reticleStory('twin', 'twin');

/** Tactical and science are each after a contact that's off the map, so each gets an arrow at the edge pointing towards it, with its label. */
export const OffscreenTargets: Story = reticleStory('farRaider', 'farTwin');

/** Both crews are after the same contact off the map, so their arrows sit one inside the other. */
export const SameOffscreenTarget: Story = reticleStory('farRaider', 'farRaider');

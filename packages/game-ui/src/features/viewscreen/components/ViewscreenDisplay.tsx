import { GameObjectInfo, RelationshipViewer, ShipInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ReadonlyKeyframes } from 'common-data/features/space/types/Keyframes';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { WeaponEffect } from 'common-data/features/space/types/WeaponEffect';
import { interpolatePosition, interpolateVector } from 'common-data/features/space/utils/interpolate';
import { Screen } from 'common-ui/components/Screen';
import { SpaceMap } from 'common-ui/features/spacemap/components/SpaceMap';
import { drawWeaponArcs, ENEMY_WEAPON_ARC_COLORS, OWN_WEAPON_ARC_COLORS } from 'common-ui/features/spacemap/utils/drawWeaponArcs';
import { useTimeProvider } from 'common-ui/hooks/useTimeProvider';
import { FC, RefObject, PropsWithChildren, useCallback, useRef } from 'react';
import { getCombatShake } from '../effects/combatShake';
import { drawCombatEffects } from '../effects/drawCombatEffects';
import { drawSpaceBackground } from '../effects/drawSpaceBackground';
import { getWarpedAwayIds } from '../effects/drawWarpAway';
import { ObjectTracker, trackObjects } from '../effects/objectTracker';
import { useCombatLabels, useShakeAndFlashes } from '../utils/combatEffectSettings';
import styles from './ViewscreenDisplay.module.css';
import { ViewscreenMenuButton } from './ViewscreenMenuButton';
import type { Snapshot } from '@colyseus/react';

type Props = PropsWithChildren<{
    /** What to keep centered on. If null (e.g. the ship was destroyed), the view stays where it last was. */
    center: ReadonlyKeyframes<Vector2D> | null;
    objects: Record<string, GameObjectInfo>;
    viewer: RelationshipViewer;
    weaponEffectsRef: RefObject<WeaponEffect[]>;
    showMenu: () => void;
}>;

/** Quiet, so the instruments stay in the background of a fight, which has plenty of its own light. */
const gridColor = 'rgba(127, 176, 200, 0.25)';

export const ViewscreenDisplay: FC<Props> = (props) => {
    const timeProvider = useTimeProvider();

    const cellRadius = 32; // TODO: make this controllable? automatic?

    const { center, objects: allObjects, weaponEffectsRef, viewer } = props;

    const showLabels = useCombatLabels();
    const shakeAndFlashes = useShakeAndFlashes();

    const lastCenter = useRef<Vector2D>({ x: 0, y: 0 });
    const tracker = useRef<ObjectTracker>(new Map()).current;

    /** What the frame being drawn is showing. This is worked out as each frame is drawn, so that frames don't need to re-render this component. */
    const frame = useRef<{ centerVector: Vector2D; objects: Record<string, GameObjectInfo> }>({ centerVector: lastCenter.current, objects: allObjects });

    const getObjects = useCallback(
        (time: number) => {
            // A ship that has jumped to warp is drawn by that effect from then on, even if it's still there, as our own ship is until the scene changes.
            const warpedAwayIds = getWarpedAwayIds(weaponEffectsRef.current, time);
            const objects = warpedAwayIds.size === 0
                ? allObjects
                : Object.fromEntries(Object.entries(allObjects).filter(([id]) => !warpedAwayIds.has(id)));

            trackObjects(tracker, objects, viewer, time);
            frame.current.objects = objects;

            return objects;
        },
        [allObjects, weaponEffectsRef, tracker, viewer]
    );

    const getCenter = useCallback(
        (time: number) => {
            if (center) {
                lastCenter.current = interpolateVector(center, time);
            }

            const centerVector = lastCenter.current;
            frame.current.centerVector = centerVector;

            // Shake what's drawn, rather than the canvas itself, so that its edges never show.
            const shake = shakeAndFlashes
                ? getCombatShake(weaponEffectsRef.current, viewer.shipId, centerVector, time)
                : { x: 0, y: 0 };

            return { x: centerVector.x + shake.x / cellRadius, y: centerVector.y + shake.y / cellRadius };
        },
        [center, shakeAndFlashes, weaponEffectsRef, viewer.shipId]
    );

    const drawExtraBackground = useCallback(
        (ctx: CanvasRenderingContext2D, _bounds: unknown, pixelSize: number) => {
            const drawTime = timeProvider.getServerTime();
            const { centerVector, objects } = frame.current;

            drawSpaceBackground(ctx, centerVector, cellRadius, drawTime);

            const localShip = viewer.shipId ? (objects[viewer.shipId] as unknown as Snapshot<ShipInfo> | undefined) : undefined;
            const ownWeaponSlots = localShip?.tacticalState?.slots;

            if (localShip && ownWeaponSlots) {
                drawWeaponArcs(ctx, interpolatePosition(localShip.motion, drawTime), ownWeaponSlots, OWN_WEAPON_ARC_COLORS, pixelSize);
            }

            const scannedTactical = localShip?.scienceState?.scannedTactical;
            const scannedTarget = scannedTactical ? objects[scannedTactical.targetId] : undefined;
            const scannedWeaponSlots = scannedTactical?.weaponSlots;

            if (scannedTarget && scannedWeaponSlots) {
                drawWeaponArcs(ctx, interpolatePosition(scannedTarget.motion, drawTime), scannedWeaponSlots, ENEMY_WEAPON_ARC_COLORS, pixelSize);
            }
        },
        [timeProvider, viewer.shipId]
    );

    const drawExtraForeground = useCallback(
        (ctx: CanvasRenderingContext2D) => {
            drawCombatEffects(ctx, weaponEffectsRef.current, tracker, timeProvider.getServerTime(), {
                showLabels,
                allowFlashes: shakeAndFlashes,
            });
        },
        [weaponEffectsRef, tracker, timeProvider, showLabels, shakeAndFlashes]
    );

    return (
        <Screen>
            <ViewscreenMenuButton showMenu={props.showMenu} />

            <SpaceMap
                className={styles.spaceMap}
                center={getCenter}
                objects={getObjects}
                animate
                viewer={props.viewer}
                cellRadius={cellRadius}
                gridColor={gridColor}
                drawExtraForeground={drawExtraForeground}
                drawExtraBackground={drawExtraBackground}
            />

            {props.children}
        </Screen>
    );
};

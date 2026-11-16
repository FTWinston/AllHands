import { LocationTargetCardDefinition } from 'common-data/features/cards/types/CardDefinition';
import { cardDefinitions } from 'common-data/features/cards/utils/cardDefinitions';
import { GameObjectInfo, RelationshipViewer } from 'common-data/features/space/types/GameObjectInfo';
import { ReadonlyKeyframes } from 'common-data/features/space/types/Keyframes';
import { Position } from 'common-data/features/space/types/Position';
import { WeaponEffect } from 'common-data/features/space/types/WeaponEffect';
import { interpolatePosition } from 'common-data/features/space/utils/interpolate';
import { parseVector } from 'common-data/features/space/utils/vectors';
import { CardCooldown } from 'common-data/types/Cooldown';
import { Button } from 'common-ui/components/Button';
import { RadialProgress } from 'common-ui/components/RadialProgress';
import { SpaceMap } from 'common-ui/features/spacemap/components/SpaceMap';
import { drawWeaponEffects } from 'common-ui/features/spacemap/utils/drawWeaponEffects';
import { useAnimationFrame } from 'common-ui/hooks/useAnimationFrame';
import { useTimeProvider } from 'common-ui/hooks/useTimeProvider';
import { classNames } from 'common-ui/utils/classNames';
import { RefObject, useCallback, useRef, useState } from 'react';
import { useActiveCard, useOverTargetId } from 'src/features/cardui/components/DragCardProvider';
import { useVisibilityAnimation } from 'src/hooks/useVisibilityAnimation';
import { useFreezeVector } from '../hooks/useFreezeVector';
import { calculateMotionPath } from '../utils/calculateMotionPath';
import { drawMotionPath } from '../utils/drawMotionPath';
import { drawShipTarget } from '../utils/drawShipTarget';
import { findNearestEligibleShip, getShipTargetRelationship } from '../utils/findNearestEligibleShip';
import { DropCells } from './DropCells';
import styles from './HelmSpaceMap.module.css';

type Props = {
    center: ReadonlyKeyframes<Position>;
    objects: Record<string, GameObjectInfo>;
    viewer: RelationshipViewer;
    activeManeuver?: CardCooldown | null;
    cancelManeuver: () => void;
    weaponEffectsRef: RefObject<WeaponEffect[]>;
};

// Base cell radius in pixels for both SpaceMap and SpaceCells
const BASE_CELL_RADIUS = 32;

export const HelmSpaceMap = (props: Props) => {
    const activeCard = useActiveCard();
    const overTargetId = useOverTargetId();

    const [zoomLevel, setZoomLevel] = useState(1);

    // Animation state for activeManeuver button
    const maneuverAnimation = useVisibilityAnimation(!!props.activeManeuver);

    const draggingLocationCard = activeCard?.targetType === 'location';
    const draggingShipCard = activeCard?.targetType === 'ship';
    const draggingMapCard = draggingLocationCard || draggingShipCard;

    // Calculate cell radius based on zoom level
    const cellRadius = BASE_CELL_RADIUS * zoomLevel;

    const canvas = useRef<HTMLCanvasElement>(null);

    useAnimationFrame();

    const timeProvider = useTimeProvider();

    const currentTime = timeProvider.getServerTime();

    const shipPosition = interpolatePosition(props.center, currentTime);

    // Freeze the center position while dropping cards, to make that easier.
    // Lerp to catch back up again when that's done.
    const centerVector = useFreezeVector(draggingMapCard, shipPosition);

    // Calculate the motion path preview when hovering over a valid target
    const motionPath = draggingLocationCard && overTargetId && activeCard
        ? (() => {
            const targetLocation = parseVector(overTargetId);
            if (!targetLocation) {
                return null;
            }

            const cardDef = cardDefinitions[activeCard.cardType];
            if (cardDef.targetType !== 'location') {
                return null;
            }

            return calculateMotionPath(
                shipPosition,
                cardDef as LocationTargetCardDefinition,
                targetLocation
            );
        })()
        : null;

    // A ship card is played on whichever eligible ship is nearest the hexagon it's over. With none anywhere, it can't be dropped.
    const shipTargetRelationship = draggingShipCard && activeCard ? getShipTargetRelationship(activeCard.cardType) : null;
    const hasShipTarget = shipTargetRelationship !== null
        && findNearestEligibleShip(props.objects, props.viewer, shipPosition, shipTargetRelationship, currentTime) !== null;
    const pointerLocation = draggingShipCard && overTargetId ? parseVector(overTargetId) : null;
    const shipTarget = shipTargetRelationship !== null && pointerLocation
        ? findNearestEligibleShip(props.objects, props.viewer, pointerLocation, shipTargetRelationship, currentTime)
        : null;

    // Draw the motion path or ship target as extra foreground content on the SpaceMap
    const drawExtraForeground = useCallback(
        (ctx: CanvasRenderingContext2D, _bounds: unknown, pixelSize: number) => {
            if (motionPath) {
                drawMotionPath(ctx, motionPath, pixelSize);
            }
            if (shipTarget && pointerLocation) {
                drawShipTarget(ctx, shipPosition, shipTarget.position, pointerLocation, pixelSize);
            }
            drawWeaponEffects(ctx, props.weaponEffectsRef.current, props.objects, timeProvider.getServerTime(), pixelSize);
        },
        [motionPath, shipTarget, pointerLocation, shipPosition, props.weaponEffectsRef, props.objects, timeProvider]
    );

    return (
        <div className={styles.spaceMapContainer}>
            {draggingMapCard && (
                <DropCells
                    className={styles.dropCellsOverlay}
                    targetType={draggingShipCard ? 'ship' : 'location'}
                    center={centerVector}
                    shipPosition={shipPosition}
                    cellRadius={cellRadius}
                    disabled={draggingShipCard && !hasShipTarget}
                />
            )}

            <SpaceMap
                className={styles.spaceMap}
                center={centerVector}
                objects={props.objects}
                viewer={props.viewer}
                cellRadius={cellRadius}
                gridColor="green"
                ref={canvas}
                drawExtraForeground={drawExtraForeground}
                shipStyle="silhouette"
            />

            <Button
                className={classNames(styles.zoomIn, draggingMapCard ? styles.zoomDisabled : null)}
                onClick={() => setZoomLevel(level => Math.min(4, level * 1.25))}
                disabled={draggingMapCard || zoomLevel >= 4}
                focusableWhenDisabled
            >
                +
            </Button>

            <Button
                className={classNames(styles.zoomOut, draggingMapCard ? styles.zoomDisabled : null)}
                onClick={() => setZoomLevel(level => Math.max(0.5, level / 1.25))}
                disabled={draggingMapCard || zoomLevel <= 0.5}
                focusableWhenDisabled
            >
                -
            </Button>

            {maneuverAnimation.visible && (
                <Button
                    className={`${styles.activeManeuver} ${maneuverAnimation.isEntering ? styles.activeManeuverEntering : ''} ${maneuverAnimation.isExiting ? styles.activeManeuverExiting : ''}`}
                    palette="danger"
                    onClick={props.cancelManeuver}
                >
                    <RadialProgress
                        progress={props.activeManeuver!}
                        title="Maneuver progress"
                        className={styles.activeManeuverProgress}
                    />
                    <span className={styles.activeManeuverIcon}>■</span>
                </Button>
            )}
        </div>
    );
};

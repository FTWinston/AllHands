import { LocationTargetCardDefinition } from 'common-data/features/cards/types/CardDefinition';
import { calculateDriftPath } from 'common-data/features/cards/utils/calculateDriftPath';
import { cardDefinitions } from 'common-data/features/cards/utils/cardDefinitions';
import { FieldInfo } from 'common-data/features/space/types/FieldInfo';
import { GameObjectInfo, RelationshipViewer } from 'common-data/features/space/types/GameObjectInfo';
import { ReadonlyKeyframes } from 'common-data/features/space/types/Keyframes';
import { Position } from 'common-data/features/space/types/Position';
import { WeaponEffect } from 'common-data/features/space/types/WeaponEffect';
import { interpolatePosition } from 'common-data/features/space/utils/interpolate';
import { parseVector } from 'common-data/features/space/utils/vectors';
import { CardCooldown, Cooldown } from 'common-data/types/Cooldown';
import { Button } from 'common-ui/components/Button';
import { RadialProgress } from 'common-ui/components/RadialProgress';
import { SpaceMap } from 'common-ui/features/spacemap/components/SpaceMap';
import { Rectangle } from 'common-ui/features/spacemap/types/Rectangle';
import { ContactLabels, drawContactLabels } from 'common-ui/features/spacemap/utils/drawContactLabels';
import { drawFields } from 'common-ui/features/spacemap/utils/drawFields';
import { drawOffscreenTargetArrows, drawTargetReticles } from 'common-ui/features/spacemap/utils/drawTargetReticles';
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
import { MomentumReadout } from './MomentumReadout';

type Props = {
    center: ReadonlyKeyframes<Position>;
    objects: Record<string, GameObjectInfo>;
    /** The lingering zones in space, drawn under the ships. */
    fields?: Record<string, FieldInfo>;
    viewer: RelationshipViewer;
    /** What this ship's crew calls each contact, by object id. Written beside each contact. */
    contactLabels?: ContactLabels;
    /** The id of the object tactical is aiming at, marked with tactical's reticle. */
    tacticalTargetId?: string;
    /** The id of the ship science is scanning, marked with science's reticle. */
    scienceTargetId?: string;
    activeManeuver?: CardCooldown | null;
    /** How many levels of Momentum the ship has, which Drift spends to slide further. */
    momentumLevel?: number;
    /** When the ship next loses a level of Momentum. */
    momentumFade?: Cooldown | null;
    cancelManeuver: () => void;
    weaponEffectsRef: RefObject<WeaponEffect[]>;
};

/** How far ahead of now to look, in milliseconds, to tell which way the ship is going and how fast. The same as the engine's. */
const driftSampleTime = 250;

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

            // Drift slides on the way the ship is going, so its path depends on that and on the Momentum there is to spend, not just where it's dropped.
            if (activeCard.cardType === 'drift') {
                const soon = interpolatePosition(props.center, currentTime + driftSampleTime);
                const velocity = { x: (soon.x - shipPosition.x) / driftSampleTime * 1000, y: (soon.y - shipPosition.y) / driftSampleTime * 1000 };
                return calculateDriftPath(shipPosition, velocity, (props.momentumLevel ?? 0) * cardDefinitions.drift.parameters.distancePerMomentum, targetLocation);
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

    // Draw the fields under everything else on the map.
    const { fields, contactLabels, tacticalTargetId, scienceTargetId } = props;
    const drawExtraBackground = useCallback(
        (ctx: CanvasRenderingContext2D, _bounds: unknown, pixelSize: number) => {
            if (fields) {
                drawFields(ctx, Object.values(fields), timeProvider.getServerTime(), pixelSize);
            }
        },
        [fields, timeProvider]
    );

    // Draw the motion path or ship target as extra foreground content on the SpaceMap
    const drawExtraForeground = useCallback(
        (ctx: CanvasRenderingContext2D, bounds: Rectangle, pixelSize: number) => {
            if (motionPath) {
                drawMotionPath(ctx, motionPath, pixelSize);
            }
            if (shipTarget && pointerLocation) {
                drawShipTarget(ctx, shipPosition, shipTarget.position, pointerLocation, pixelSize);
            }
            const drawTime = timeProvider.getServerTime();
            if (contactLabels) {
                drawContactLabels(ctx, Object.values(props.objects), contactLabels, props.viewer, drawTime, pixelSize);
            }
            drawTargetReticles(ctx, props.objects, { tacticalTargetId, scienceTargetId }, drawTime, pixelSize);
            drawOffscreenTargetArrows(ctx, bounds, props.objects, { tacticalTargetId, scienceTargetId }, drawTime, pixelSize, contactLabels);
            drawWeaponEffects(ctx, props.weaponEffectsRef.current, props.objects, drawTime, pixelSize);
        },
        [motionPath, shipTarget, pointerLocation, shipPosition, props.weaponEffectsRef, props.objects, props.viewer, timeProvider, contactLabels, tacticalTargetId, scienceTargetId]
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
                drawExtraBackground={drawExtraBackground}
                drawExtraForeground={drawExtraForeground}
                shipStyle="silhouette"
            />

            <MomentumReadout
                className={styles.momentum}
                level={props.momentumLevel ?? 0}
                fade={props.momentumFade}
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

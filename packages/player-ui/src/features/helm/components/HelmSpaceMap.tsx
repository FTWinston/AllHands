import { LocationTargetCardDefinition } from 'common-data/features/cards/types/CardDefinition';
import { cardDefinitions } from 'common-data/features/cards/utils/cardDefinitions';
import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ITimeProvider } from 'common-data/features/space/types/ITimeProvider';
import { ReadonlyKeyframes } from 'common-data/features/space/types/Keyframes';
import { Position } from 'common-data/features/space/types/Position';
import { interpolatePosition } from 'common-data/features/space/utils/interpolate';
import { parseVector } from 'common-data/features/space/utils/vectors';
import { CardCooldown } from 'common-data/types/Cooldown';
import { Button } from 'common-ui/components/Button';
import { RadialProgress } from 'common-ui/components/RadialProgress';
import { SpaceMap } from 'common-ui/features/spacemap/components/SpaceMap';
import { useAnimationFrame } from 'common-ui/hooks/useAnimationFrame';
import { useCallback, useRef, useState } from 'react';
import { useActiveCard, useOverTargetId } from 'src/features/cardui/components/DragCardProvider';
import { useVisibilityAnimation } from 'src/hooks/useVisibilityAnimation';
import { useFreezeVector } from '../hooks/useFreezeVector';
import { calculateMotionPath } from '../utils/calculateMotionPath';
import { drawMotionPath } from '../utils/drawMotionPath';
import { DropCells } from './DropCells';
import styles from './HelmSpaceMap.module.css';

type Props = {
    timeProvider: ITimeProvider;
    center: ReadonlyKeyframes<Position>;
    objects: Record<string, GameObjectInfo>;
    activeManeuver?: CardCooldown | null;
    cancelManeuver: () => void;
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

    // Calculate cell radius based on zoom level
    const cellRadius = BASE_CELL_RADIUS * zoomLevel;

    const canvas = useRef<HTMLCanvasElement>(null);

    useAnimationFrame();

    const currentTime = props.timeProvider.getServerTime();

    const shipPosition = interpolatePosition(props.center, currentTime);

    // Freeze the center position while dropping cards, to make that easier.
    // Lerp to catch back up again when that's done.
    const centerVector = useFreezeVector(!!draggingLocationCard, shipPosition);

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

    // Draw the motion path as extra foreground content on the SpaceMap
    const drawExtraForeground = useCallback(
        (ctx: CanvasRenderingContext2D, _bounds: unknown, pixelSize: number) => {
            if (motionPath) {
                drawMotionPath(ctx, motionPath, pixelSize);
            }
        },
        [motionPath]
    );

    return (
        <div className={styles.spaceMapContainer}>
            <SpaceMap
                className={styles.spaceMap}
                timeProvider={props.timeProvider}
                center={centerVector}
                objects={props.objects}
                cellRadius={cellRadius}
                gridColor="green"
                ref={canvas}
                drawExtraForeground={motionPath ? drawExtraForeground : undefined}
            />

            {draggingLocationCard && (
                <DropCells
                    className={styles.dropCellsOverlay}
                    center={centerVector}
                    shipPosition={shipPosition}
                    cellRadius={cellRadius}
                />
            )}

            <Button
                className={styles.zoomIn}
                onClick={() => setZoomLevel(level => Math.min(4, level * 1.25))}
                disabled={draggingLocationCard || zoomLevel >= 4}
                focusableWhenDisabled
            >
                +
            </Button>

            <Button
                className={styles.zoomOut}
                onClick={() => setZoomLevel(level => Math.max(0.5, level / 1.25))}
                disabled={draggingLocationCard || zoomLevel <= 0.5}
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

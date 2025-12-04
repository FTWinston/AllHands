import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ITimeProvider } from 'common-data/features/space/types/ITimeProvider';
import { Keyframes } from 'common-data/features/space/types/Keyframes';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { interpolateVector } from 'common-data/features/space/utils/interpolate';
import { Button } from 'common-ui/components/Button';
import { SpaceMap } from 'common-ui/features/spacemap/components/SpaceMap';
import { useAnimationFrame } from 'common-ui/hooks/useAnimationFrame';
import { useRef, useState } from 'react';
import { useActiveCard } from 'src/features/cardhand/components/DragCardProvider';
import { useFreezeVector } from '../hooks/useFreezeVector';
import { DropCells } from './DropCells';
import styles from './HelmSpaceMap.module.css';

type Props = {
    timeProvider: ITimeProvider;
    center: Keyframes<Vector2D>;
    objects: GameObjectInfo[];
};

// Base cell radius in pixels for both SpaceMap and SpaceCells
const BASE_CELL_RADIUS = 32;

export const HelmSpaceMap = (props: Props) => {
    const activeCard = useActiveCard();

    const [zoomLevel, setZoomLevel] = useState(1);

    const draggingLocationCard = activeCard?.targetType === 'location';

    // Calculate cell radius based on zoom level
    const cellRadius = BASE_CELL_RADIUS * zoomLevel;

    const canvas = useRef<HTMLCanvasElement>(null);

    useAnimationFrame();

    const currentTime = props.timeProvider.getServerTime();

    let centerVector = interpolateVector(props.center, currentTime);

    // Freeze the center position while dropping cards, to make that easier.
    // Lerp to catch back up again when that's done.
    centerVector = useFreezeVector(!!draggingLocationCard, centerVector);

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
            />

            {draggingLocationCard && (
                <DropCells
                    className={styles.dropCellsOverlay}
                    center={centerVector}
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
        </div>
    );
};

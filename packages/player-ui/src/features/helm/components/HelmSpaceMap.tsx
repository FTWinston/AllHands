import { ITimeProvider, Vector2D } from 'common-types';
import { SpaceCells } from 'common-ui/features/spacemap/components/SpaceCells';
import { useRef } from 'react';
import { CardDropTarget } from 'src/components/CardDropTarget';
import { useActiveCard } from 'src/components/DragCardProvider';
import styles from './HelmSpaceMap.module.css';

type Props = {
    className?: string;
    timeSynchronizer: ITimeProvider;
    center: Vector2D;
};

const INTERPOLATION_DURATION_MS = 2000;

/**
 * Returns the given Vector2D, but freezes it while a location card is being dragged.
 * When the drag ends, interpolates smoothly from the frozen value to the current value.
 */
function useFreezeWhileDragging(value: Vector2D): Vector2D {
    const activeCard = useActiveCard();
    const isDragging = activeCard?.targetType === 'location';

    const frozenValue = useRef(value);
    const wasDragging = useRef(false);

    // Track when interpolation started and from what value
    const interpolationStartTime = useRef<number | null>(null);
    const interpolationStartValue = useRef<Vector2D | null>(null);

    // Detect drag start/end transitions
    if (isDragging && !wasDragging.current) {
        // Just started dragging - freeze the current value
        frozenValue.current = value;
    } else if (!isDragging && wasDragging.current) {
        // Just stopped dragging - start interpolation from frozen value
        interpolationStartTime.current = performance.now();
        interpolationStartValue.current = frozenValue.current;
    } else if (!isDragging && interpolationStartTime.current === null) {
        // Not dragging and not interpolating - keep frozen value up to date
        frozenValue.current = value;
    }
    wasDragging.current = isDragging;

    if (isDragging) {
        return frozenValue.current;
    }

    // Check if we're interpolating
    if (interpolationStartTime.current !== null && interpolationStartValue.current !== null) {
        const elapsed = performance.now() - interpolationStartTime.current;
        const t = Math.min(elapsed / INTERPOLATION_DURATION_MS, 1);

        if (t >= 1) {
            // Interpolation complete
            interpolationStartTime.current = null;
            interpolationStartValue.current = null;
            return value;
        }

        // Ease-out interpolation for smoother feel
        const eased = 1 - Math.pow(1 - t, 3);

        return {
            x: interpolationStartValue.current.x + (value.x - interpolationStartValue.current.x) * eased,
            y: interpolationStartValue.current.y + (value.y - interpolationStartValue.current.y) * eased,
        };
    }

    return value;
}

export const HelmSpaceMap = (props: Props) => {
    const center = useFreezeWhileDragging(props.center);

    return (
        <SpaceCells
            className={props.className}
            center={center}
            fontSizeEm={2}
            renderOverride={(id, CellComponent, cellProps) => (
                <CardDropTarget
                    id={id}
                    key={id}
                    render={CellComponent}
                    targetType="location"
                    couldDropClassName={styles.couldDrop}
                    droppingClassName={styles.dropping}
                    {...cellProps}
                />
            )}
        />
    );
};

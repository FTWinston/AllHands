import { ITimeProvider, Keyframes, MapItem, Vector2D } from 'common-types';
import { Button } from 'common-ui/components/Button';
import { SpaceCells } from 'common-ui/features/spacemap/components/SpaceCells';
import { useState } from 'react';
import { CardDropTarget } from 'src/components/CardDropTarget';
import { useActiveCard } from 'src/components/DragCardProvider';
import styles from './HelmSpaceMap.module.css';

type Props = {
    className?: string;
    timeProvider: ITimeProvider;
    center: Keyframes<Vector2D>;
    items: MapItem[];
};

export const HelmSpaceMap = (props: Props) => {
    const activeCard = useActiveCard();

    const [zoomLevel, setZoomLevel] = useState(2.5);

    const draggingLocationCard = activeCard?.targetType === 'location';

    return (
        <>
            <SpaceCells
                className={props.className}
                center={props.center}
                freezeCenter={activeCard?.targetType === 'location'}
                timeProvider={props.timeProvider}
                fontSizeEm={zoomLevel}
                items={props.items}
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

            <Button
                className={styles.zoomIn}
                onClick={() => setZoomLevel(level => Math.min(4.5, level + 0.5))}
                disabled={draggingLocationCard || zoomLevel >= 4.5}
                focusableWhenDisabled
            >
                +
            </Button>

            <Button
                className={styles.zoomOut}
                onClick={() => setZoomLevel(level => Math.max(1, level - 0.5))}
                disabled={draggingLocationCard || zoomLevel <= 1}
                focusableWhenDisabled
            >
                -
            </Button>
        </>
    );
};

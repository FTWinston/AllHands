import { interpolatePosition, interpolateVector, ITimeProvider, Keyframes, MapItem, Vector2D } from 'common-types';
import { FC, JSX, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useAnimationFrame } from 'src/hooks/useAnimationFrame';
import { ShipIcon } from 'src/icons/ships';
import { classNames } from 'src/utils/classNames';
import { useFreezeVector } from '../hooks/useFreezeVector';
import { CellInfo } from '../types/CellInfo';
import { SpaceCell } from './SpaceCell';
import styles from './SpaceCells.module.css';

type SpaceCellProps = {
    gridColumn: string;
    gridRow: string;
};

type Props = {
    center: Keyframes<Vector2D>;
    items: MapItem[];
    freezeCenter?: boolean;
    timeProvider: ITimeProvider;
    fontSizeEm: number;
    className?: string;
    renderOverride?: (id: string, CellComponent: typeof SpaceCell, cellProps: SpaceCellProps) => JSX.Element;
};

// Cell dimensions in em units
const cellWidthEm = 2.3094;
const cellHeightEm = 2.0;

// Horizontal spacing between cell centers (3/4 of cell width due to hexagonal packing)
const cellSpacingEmX = cellWidthEm * 0.75;
// Vertical spacing between cell centers
const cellSpacingEmY = cellHeightEm;

export const SpaceCells: FC<Props> = (props) => {
    const ref = useRef<HTMLDivElement>(null);

    const { center, timeProvider, fontSizeEm, renderOverride } = props;

    const [containerInfo, setContainerInfo] = useState<{ width: number; height: number; fontSizePx: number }>({ width: 0, height: 0, fontSizePx: 16 });

    useLayoutEffect(
        () => {
            const updateSize = () => {
                if (!ref.current) {
                    return;
                }

                const bounds = ref.current.getBoundingClientRect();
                const fontSizePx = parseFloat(
                    window.getComputedStyle(ref.current).fontSize
                );
                setContainerInfo({ width: bounds.width, height: bounds.height, fontSizePx });
            };

            updateSize();

            const resizeObserver = new ResizeObserver(() => updateSize());
            resizeObserver.observe(ref.current!);

            return () => resizeObserver.disconnect();
        },
        [fontSizeEm]
    );

    useAnimationFrame();

    const currentTime = timeProvider.getServerTime();

    let centerVector = interpolateVector(center, currentTime);

    // If freezing is enabled, do not update the center position.
    centerVector = useFreezeVector(!!props.freezeCenter, centerVector);

    // Calculate cell spacing in pixels using the computed font size.
    const spacingPxX = cellSpacingEmX * containerInfo.fontSizePx;
    const spacingPxY = cellSpacingEmY * containerInfo.fontSizePx;

    // Calculate how many cells we need to fill the container (with some buffer).
    const numColumnsToFit = Math.ceil(containerInfo.width / spacingPxX + 3);
    const numRowsToFit = Math.ceil(containerInfo.height / spacingPxY + 1.25);

    const columns = Math.min(100, Math.max(1, numColumnsToFit));
    const rows = Math.min(100, Math.max(1, numRowsToFit));

    // Calculate the world-space cell that contains the center point.
    const centerCellX = Math.floor(centerVector.x + 0.5);
    const centerCellY = Math.floor(centerVector.y + 0.5);

    // Calculate the fractional offset from the center cell.
    // This determines how much to shift the entire grid.
    const fractionalX = centerVector.x - centerCellX;
    const fractionalY = centerVector.y - centerCellY;

    // Memoize the cell extent calculation - this only changes when centerCellX/centerCellY changes,
    // not every frame. This prevents the grid template from being recalculated every frame.
    const cellExtent = useMemo(() => {
        const halfColumns = Math.floor(columns / 2);
        const halfRows = Math.floor(rows / 2);

        // Ensure startX is always even to prevent the hexagonal offset pattern from jumping
        // when the grid scrolls. We'll adjust the offset to compensate.
        let startX = centerCellX - halfColumns;
        let startXIsOdd = false;

        // If startX is odd, shift it to be even and compensate with pixel offset.
        if (Math.abs(startX) % 2 === 1) {
            startX -= 1;
            startXIsOdd = true;
        }

        const startY = centerCellY - halfRows;

        // Generate cells with world-space coordinates.
        const cells: CellInfo[] = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                const worldX = startX + col;
                const worldY = startY + row;
                cells.push({ id: `${worldX},${worldY}` });
            }
        }

        return { columns, rows, startX, startY, startXIsOdd, cells };
    }, [columns, rows, centerCellX, centerCellY]);

    // Calculate pixel offsets every frame for smooth motion.
    const offsetXAdjust = cellExtent.startXIsOdd ? -spacingPxX : 0;
    const offsetX = -fractionalX * spacingPxX + offsetXAdjust;
    const offsetY = -fractionalY * spacingPxY;

    const renderCell = (cell: CellInfo, index: number) => {
        // Parse the world coordinates from the cell ID.
        const [worldXStr] = cell.id.split(',');
        const worldX = parseInt(worldXStr, 10);

        // Calculate grid position.
        // Column position in the grid (relative to startX).
        const colIndex = worldX - cellExtent.startX;

        // Grid column: each hex column takes up 2 grid tracks, and we need an extra one for the first hex.
        const gridCol = colIndex * 2 + 1;

        // Grid row: each hex row takes up 2 grid tracks.
        // Odd columns (in world space) are offset by half a cell.
        let gridRow = (index / cellExtent.columns | 0) * 2 + 1;

        // Apply vertical offset for odd columns in world space.
        // This creates the characteristic hexagonal stagger.
        // Use Math.abs to handle negative world coordinates correctly.
        if (Math.abs(worldX) % 2 === 1) {
            gridRow += 1;
        }

        const cellProps: SpaceCellProps = {
            gridColumn: `${gridCol} / span 3`,
            gridRow: `${gridRow} / span 2`,
        };

        if (renderOverride) {
            return renderOverride(cell.id, SpaceCell, cellProps);
        }

        return (
            <SpaceCell
                key={cell.id}
                {...cellProps}
            >
                {cell.id}
            </SpaceCell>
        );
    };

    const renderItem = (item: MapItem) => {
        const position = interpolatePosition(item.position, currentTime);

        // Calculate item position relative to the center in world space.
        const relativeX = position.x - centerVector.x;
        const relativeY = position.y - centerVector.y;

        // Convert world space offset to pixels.
        const itemOffsetX = relativeX * spacingPxX;
        const itemOffsetY = relativeY * spacingPxY;

        return (
            <ShipIcon
                key={item.id}
                className={classNames(styles.item, styles[`item--${item.color}`])}
                appearance={item.appearance}
                angle={position.angle}
                offsetX={itemOffsetX}
                offsetY={itemOffsetY}
                size={item.size}
            />
        );
    };

    // Memoize the grid container style so it only changes when the grid extent changes.
    const gridContainerStyle = useMemo(() => ({
        gridTemplateColumns: `repeat(${cellExtent.columns}, calc(var(--cellWidth) * 0.25) calc(var(--cellWidth) * 0.5)) calc(var(--cellWidth) * 0.25)`,
        gridTemplateRows: `repeat(${cellExtent.rows * 2}, calc(var(--cellHeight) / 2))`,
    }), [cellExtent.columns, cellExtent.rows]);

    return (
        <div
            className={classNames(styles.cells, props.className)}
            ref={ref}
            style={{
                'fontSize': `${fontSizeEm}em`,
                // @ts-expect-error CSS custom property
                '--cellWidth': `${cellWidthEm}em`,
                '--cellHeight': `${cellHeightEm}em`,
                // Offset is on parent so grid container's style object is stable
                '--offsetX': `${offsetX}px`,
                '--offsetY': `${offsetY}px`,
            }}
        >
            <div
                className={styles.gridContainer}
                style={gridContainerStyle}
            >
                {cellExtent.cells.map(renderCell)}
            </div>
            {props.items.map(renderItem)}
        </div>
    );
};

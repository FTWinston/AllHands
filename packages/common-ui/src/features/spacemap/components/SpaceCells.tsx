import { Vector2D } from 'common-types';
import { FC, JSX, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { classNames } from 'src/utils/classNames';
import { CellInfo } from '../types/CellInfo';
import { SpaceCell } from './SpaceCell';
import styles from './SpaceCells.module.css';

type SpaceCellProps = {
    gridColumn: string;
    gridRow: string;
};

type Props = {
    center: Vector2D;
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

    const { center, fontSizeEm, renderOverride } = props;

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

    const gridData = useMemo(() => {
        if (containerInfo.width === 0 || containerInfo.height === 0) {
            return { cells: [], columns: 0, rows: 0, offsetX: 0, offsetY: 0, startX: 0, startY: 0 };
        }

        // Calculate cell spacing in pixels using the computed font size.
        const spacingPxX = cellSpacingEmX * containerInfo.fontSizePx;
        const spacingPxY = cellSpacingEmY * containerInfo.fontSizePx;

        // Calculate how many cells we need to fill the container (with some buffer).
        const numColumnsToFit = Math.ceil(containerInfo.width / spacingPxX + 2.25);
        const numRowsToFit = Math.ceil(containerInfo.height / spacingPxY + 1);

        const columns = Math.min(100, Math.max(1, numColumnsToFit));
        const rows = Math.min(100, Math.max(1, numRowsToFit));

        // Calculate the world-space cell that contains the center point.
        const centerCellX = Math.floor(center.x + 0.5);
        const centerCellY = Math.floor(center.y + 0.5);

        // Calculate the fractional offset from the center cell.
        // This determines how much to shift the entire grid.
        const fractionalX = center.x - centerCellX;
        const fractionalY = center.y - centerCellY;

        // Calculate the starting world-space coordinates.
        // We want to center the grid around centerCellX, centerCellY.
        const halfColumns = Math.floor(columns / 2);
        const halfRows = Math.floor(rows / 2);

        // Ensure startX is always even to prevent the hexagonal offset pattern from jumping
        // when the grid scrolls. We'll adjust the offset to compensate.
        let startX = centerCellX - halfColumns;
        let offsetXAdjust = 0;

        // If startX is odd, shift it to be even and compensate with pixel offset.
        if (Math.abs(startX) % 2 === 1) {
            startX -= 1;
            offsetXAdjust = -spacingPxX;
        }

        const startY = centerCellY - halfRows;

        // Convert fractional offset to pixels.
        const offsetX = -fractionalX * spacingPxX + offsetXAdjust;
        const offsetY = -fractionalY * spacingPxY;

        // Generate cells with world-space coordinates.
        const cells: CellInfo[] = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                const worldX = startX + col;
                const worldY = startY + row;
                cells.push({ id: `${worldX},${worldY}` });
            }
        }

        return { cells, columns, rows, offsetX, offsetY, startX, startY };
    }, [center.x, center.y, containerInfo]);

    const { cells, columns, rows, offsetX, offsetY, startX } = gridData;

    const renderCell = (cell: CellInfo, index: number) => {
        // Parse the world coordinates from the cell ID.
        const [worldXStr, _worldYStr] = cell.id.split(',');
        const worldX = parseInt(worldXStr, 10);

        // Calculate grid position.
        // Column position in the grid (relative to startX).
        const colIndex = worldX - startX;

        // Grid column: each hex column takes up 2 grid tracks, plus we need 3 for the first hex.
        const gridCol = colIndex * 2 + 1;

        // Grid row: each hex row takes up 2 grid tracks.
        // Odd columns (in world space) are offset by half a cell.
        let gridRow = (index / columns | 0) * 2 + 1;

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

    return (
        <div
            className={classNames(styles.cells, props.className)}
            ref={ref}
            style={{
                'fontSize': `${fontSizeEm}em`,
                // @ts-expect-error CSS custom property
                '--cellWidth': `${cellWidthEm}em`,
                '--cellHeight': `${cellHeightEm}em`,
            }}
        >
            <div
                className={styles.gridContainer}
                style={{
                    // @ts-expect-error CSS custom property
                    '--offsetX': `${offsetX}px`,
                    '--offsetY': `${offsetY}px`,
                    'gridTemplateColumns': `repeat(${columns}, calc(var(--cellWidth) * 0.25) calc(var(--cellWidth) * 0.5)) calc(var(--cellWidth) * 0.25)`,
                    'gridTemplateRows': `repeat(${rows * 2}, calc(var(--cellHeight) / 2))`,
                }}
            >
                {cells.map(renderCell)}
            </div>
        </div>
    );
};

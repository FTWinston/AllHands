import { LocationTargetCardDefinition } from 'common-data/features/cards/types/CardDefinition';
import { cardDefinitions } from 'common-data/features/cards/utils/cardDefinitions';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { distance, serializeVector } from 'common-data/features/space/utils/vectors';
import { classNames } from 'common-ui/utils/classNames';
import { FC, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import { useActiveCard } from 'src/features/cardui/components/DragCardProvider';
import styles from './DropCells.module.css';

type CellInfo = {
    col: number;
    row: number;
};

type Props = {
    center: Vector2D;
    shipPosition: Vector2D;
    cellRadius: number;
    className?: string;
};

// Hexagon geometry constants (flat-top hex)
// These match the SpaceMap's hex grid exactly
const horizontalHexSpacing = 1.5;
const verticalHexSpacing = Math.sqrt(3); // 1.7320508075688772

// Cell dimensions relative to cellRadius (flat-top hex)
// Width = 2 * cellRadius (flat-top hex, point-to-point width)
// Height = √3 * cellRadius (flat-top hex, flat-side to flat-side height)
const getCellWidthPx = (cellRadius: number) => 2 * cellRadius;
const getCellHeightPx = (cellRadius: number) => verticalHexSpacing * cellRadius;

// Convert axial hex coordinates (col, row) to world position
// This matches getClosestCellCenter in drawHexGrid.ts
function hexToWorld(col: number, row: number): Vector2D {
    return {
        x: horizontalHexSpacing * col,
        y: verticalHexSpacing * (row + col / 2),
    };
}

// Convert world position to axial hex coordinates (col, row)
// This is the inverse of hexToWorld, matching getClosestCellCenter logic
function worldToHex(worldX: number, worldY: number): { col: number; row: number } {
    // Using cube coordinates for accurate hex picking
    const fCol = worldX * 2 / 3;
    const fRow = (worldX - Math.sqrt(3) * worldY) / -3;
    const fThirdCoord = -fCol - fRow;

    let iCol = Math.round(fCol);
    let iRow = Math.round(fRow);
    const iThird = Math.round(fThirdCoord);

    const colDiff = Math.abs(iCol - fCol);
    const rowDiff = Math.abs(iRow - fRow);
    const thirdDiff = Math.abs(iThird - fThirdCoord);

    if (colDiff >= rowDiff) {
        if (colDiff >= thirdDiff) {
            iCol = -iRow - iThird;
        }
    } else if (rowDiff >= colDiff && rowDiff >= thirdDiff) {
        iRow = -iCol - iThird;
    }

    return { col: iCol, row: iRow };
}

export const DropCells: FC<Props> = (props) => {
    const ref = useRef<HTMLDivElement>(null);

    const { center, shipPosition, cellRadius } = props;

    const activeCard = useActiveCard();

    // Get distance constraints from the active card's definition
    const cardDef = activeCard ? cardDefinitions[activeCard.cardType] : null;
    const minDistance = cardDef?.targetType === 'location' ? (cardDef as LocationTargetCardDefinition).minDistance : undefined;
    const maxDistance = cardDef?.targetType === 'location' ? (cardDef as LocationTargetCardDefinition).maxDistance : undefined;

    const [containerInfo, setContainerInfo] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

    useLayoutEffect(
        () => {
            const updateSize = () => {
                if (!ref.current) {
                    return;
                }

                const bounds = ref.current.getBoundingClientRect();
                setContainerInfo({ width: bounds.width, height: bounds.height });
            };

            updateSize();

            const resizeObserver = new ResizeObserver(() => updateSize());
            resizeObserver.observe(ref.current!);

            return () => resizeObserver.disconnect();
        },
        [cellRadius]
    );

    const cellWidthPx = getCellWidthPx(cellRadius);
    const cellHeightPx = getCellHeightPx(cellRadius);

    // Calculate view bounds in world space (matching SpaceMap's getViewWorldBounds)
    const viewWorldWidth = containerInfo.width / cellRadius;
    const viewWorldHeight = containerInfo.height / cellRadius;

    // Find the hex cell at the center
    const centerHex = worldToHex(center.x, center.y);

    // Calculate how many cells we need to cover the view
    // Add buffer to ensure we cover edges
    const numCols = Math.ceil(viewWorldWidth / horizontalHexSpacing) + 4;
    const numRows = Math.ceil(viewWorldHeight / verticalHexSpacing) + 4;

    const halfCols = Math.floor(numCols / 2);
    const halfRows = Math.floor(numRows / 2);

    // Generate cells centered around the center hex
    // The hex grid offsets each column by col/2 rows vertically, so we need extra
    // rows to cover the diagonal corners (top-right and bottom-left)
    const cells = useMemo(() => {
        const result: CellInfo[] = [];
        // Extra row buffer to account for hex grid diagonal offset
        const extraRowBuffer = Math.ceil(halfCols / 2);

        // View bounds for visibility filtering (in pixels from center)
        const viewHalfWidth = containerInfo.width / 2;
        const viewHalfHeight = containerInfo.height / 2;
        const cellHalfWidth = cellWidthPx / 2;
        const cellHalfHeight = cellHeightPx / 2;

        for (let dc = -halfCols; dc <= halfCols; dc++) {
            for (let dr = -halfRows - extraRowBuffer; dr <= halfRows + extraRowBuffer; dr++) {
                const col = centerHex.col + dc;
                const row = centerHex.row + dr;

                // Get world position and calculate screen position
                const worldPos = hexToWorld(col, row);
                const screenX = (worldPos.x - center.x) * cellRadius;
                const screenY = (worldPos.y - center.y) * cellRadius;

                // Only include cells that are at least partially visible on screen
                const isPartiallyVisible
                    = Math.abs(screenX) < viewHalfWidth + cellHalfWidth
                        && Math.abs(screenY) < viewHalfHeight + cellHalfHeight;

                if (isPartiallyVisible) {
                    result.push({ col, row });
                }
            }
        }
        return result;
    }, [centerHex.col, centerHex.row, halfCols, halfRows, center.x, center.y, cellRadius, cellWidthPx, cellHeightPx, containerInfo.width, containerInfo.height]);

    const renderCell = (cell: CellInfo) => {
        // Get world position of this hex center
        const worldPos = hexToWorld(cell.col, cell.row);
        const cellId = serializeVector(worldPos);

        // Check if cell is within valid distance range (in world units, not pixels)
        const cellDistance = distance(worldPos, shipPosition);
        const isTooClose = minDistance !== undefined && cellDistance < minDistance;
        const isTooFar = maxDistance !== undefined && cellDistance > maxDistance;
        const isDisabled = isTooClose || isTooFar;

        // Convert to screen position relative to view center
        // The view center (in world coords) is at the screen center
        const screenX = (worldPos.x - center.x) * cellRadius;
        const screenY = (worldPos.y - center.y) * cellRadius;

        // Position from container center, offset by half cell size to center the cell
        const left = containerInfo.width / 2 + screenX - cellWidthPx / 2;
        const top = containerInfo.height / 2 + screenY - cellHeightPx / 2;

        return (
            <CardDropTarget
                key={cellId}
                id={cellId}
                targetType="location"
                className={styles.cell}
                style={{
                    left,
                    top,
                }}
                couldDropClassName={styles.couldDrop}
                droppingClassName={styles.dropping}
                disabled={isDisabled}
            />
        );
    };

    return (
        <div
            className={classNames(styles.cells, props.className)}
            ref={ref}
            style={{
                // @ts-expect-error CSS custom property
                '--cellWidth': `${cellWidthPx}px`,
                '--cellHeight': `${cellHeightPx}px`,
            }}
        >
            {cells.map(renderCell)}
        </div>
    );
};

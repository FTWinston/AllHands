import { LocationTargetCardDefinition } from 'common-data/features/cards/types/CardDefinition';
import { cardDefinitions } from 'common-data/features/cards/utils/cardDefinitions';
import { Position } from 'common-data/features/space/types/Position';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { clampAngle, determineAngle, distance, serializeVector } from 'common-data/features/space/utils/vectors';
import { classNames } from 'common-ui/utils/classNames';
import { FC, memo, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import { useActiveCard } from 'src/features/cardui/components/DragCardProvider';
import styles from './DropCells.module.css';

type CellInfo = {
    col: number;
    row: number;
};

type Props = {
    /** What kind of card the cells take: a location card is played on the cell it's dropped on, and a ship card on the eligible ship nearest that cell. */
    targetType: 'location' | 'ship';
    /** Whether no cell can take the card. */
    disabled?: boolean;
    center: Vector2D;
    /** Where the ship is, and which way it faces, which some cards limit where they can be dropped by. */
    shipPosition: Position;
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

type DropCellProps = {
    id: string;
    targetType: 'location' | 'ship';
    left: number;
    top: number;
    disabled: boolean;
};

/**
 * One cell, which only re-renders when where it is or whether it can be dropped on changes. The cells as a whole are worked out again whenever the ship moves,
 * which while it's flying is every frame, but re-rendering hundreds of drop targets that often is slow enough to drag the whole page down.
 */
const DropCell = memo((props: DropCellProps) => (
    <CardDropTarget
        id={props.id}
        targetType={props.targetType}
        className={styles.cell}
        style={{
            left: props.left,
            top: props.top,
        }}
        couldDropClassName={styles.couldDrop}
        droppingClassName={styles.dropping}
        disabled={props.disabled}
    />
));

const DropCellsInner: FC<Props> = (props) => {
    const ref = useRef<HTMLDivElement>(null);

    const { center, shipPosition, cellRadius } = props;

    const activeCard = useActiveCard();

    // Get distance constraints from the active card's definition
    const cardDef = activeCard ? cardDefinitions[activeCard.cardType] : null;
    const minDistance = cardDef?.targetType === 'location' ? (cardDef as LocationTargetCardDefinition).minDistance : undefined;
    const maxDistance = cardDef?.targetType === 'location' ? (cardDef as LocationTargetCardDefinition).maxDistance : undefined;
    const maxBearing = cardDef?.targetType === 'location' ? (cardDef as LocationTargetCardDefinition).maxBearing : undefined;

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
        const isOffBearing = maxBearing !== undefined && cellDistance > 0.001
            && Math.abs(clampAngle(determineAngle(shipPosition, worldPos) - shipPosition.angle)) > maxBearing + 1e-6;
        const isDisabled = props.disabled === true || isTooClose || isTooFar || isOffBearing;

        // Convert to screen position relative to view center
        // The view center (in world coords) is at the screen center
        const screenX = (worldPos.x - center.x) * cellRadius;
        const screenY = (worldPos.y - center.y) * cellRadius;

        // Position from container center, offset by half cell size to center the cell
        const left = containerInfo.width / 2 + screenX - cellWidthPx / 2;
        const top = containerInfo.height / 2 + screenY - cellHeightPx / 2;

        return (
            <DropCell
                key={cellId}
                id={cellId}
                targetType={props.targetType}
                left={left}
                top={top}
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

/** Whether two positions are the same, though they're different objects. */
function samePosition(a: Vector2D, b: Vector2D) {
    return a.x === b.x && a.y === b.y;
}

/**
 * The helm map re-renders on every animation frame, and hands these cells new position objects each time even when the ship hasn't moved.
 * They're only worked out again when something they show has actually changed: which way the ship faces counts, as some cards can only be dropped ahead of it.
 */
export const DropCells = memo(DropCellsInner, (previous, next) => previous.targetType === next.targetType
    && previous.disabled === next.disabled
    && previous.cellRadius === next.cellRadius
    && previous.className === next.className
    && samePosition(previous.center, next.center)
    && samePosition(previous.shipPosition, next.shipPosition)
    && previous.shipPosition.angle === next.shipPosition.angle);

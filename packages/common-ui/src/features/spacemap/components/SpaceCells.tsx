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

const cellWidthEm = 2.3094;
const cellHeightEm = 2.0;

export const SpaceCells: FC<Props> = (props) => {
    const ref = useRef<HTMLDivElement>(null);

    const { center, fontSizeEm, renderOverride } = props;

    const [columns, setColumns] = useState<number>(1);
    const [rows, setRows] = useState<number>(1);

    useLayoutEffect(
        () => {
            const updateSize = () => {
                if (!ref.current) {
                    return;
                }

                const bounds = ref.current.getBoundingClientRect();

                const containerWidthPx = bounds.width;
                const containerHeightPx = bounds.height;

                const fontSizePx = parseFloat(
                    window.getComputedStyle(ref.current).fontSize
                );
                const cellWidthPx = cellWidthEm * fontSizePx + 1; // +1px for gap
                const cellHeightPx = cellHeightEm * fontSizePx + 1; // +1px for gap

                const numColumnsToFit = Math.ceil(4 / 3 * containerWidthPx / cellWidthPx - 0.25);
                const numRowsToFit = Math.ceil(containerHeightPx / cellHeightPx - 0.25);

                setColumns(Math.min(100, Math.max(1, numColumnsToFit)));
                setRows(Math.min(100, Math.max(1, numRowsToFit)));
            };

            updateSize();

            const resizeObserver = new ResizeObserver(() => updateSize());
            resizeObserver.observe(ref.current!);

            return () => resizeObserver.disconnect();
        },
        [fontSizeEm]
    );

    const cells = useMemo(
        () => {
            // Create an array of cells, of length rows * columns, using the index as each object's ID.
            const result = Array.from<CellInfo | null>({ length: rows * columns })
                .map((_, index) => {
                    const cellId = (index + 1).toString();
                    return { id: cellId };
                });

            return result;
        },
        [rows, columns]
    );

    const renderCell = (cell: CellInfo | null, index: number) => {
        if (cell === null) {
            return null;
        }

        let row = Math.floor(index / columns) * 2 + 1;
        let col = (index % columns);

        if (col % 2 === 0) {
            row += 1;
        }
        col = col * 2 + 1;

        const cellProps: SpaceCellProps = {
            gridColumn: `${col} / span 3`,
            gridRow: `${row} / span 2`,
        };

        // Pass the cell component to the render override function, if provided.
        // (That can be used to e.g. render each cell as a CardDropTarget.)
        // If not, render the cell directly.
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
                'gridTemplateColumns': `repeat(${columns}, calc(var(--cellWidth) * 0.25) calc(var(--cellWidth) * 0.5)) calc(var(--cellWidth) * 0.25)`,
                'gridTemplateRows': `repeat(${rows * 2}, calc(var(--cellHeight) / 2))`,
            }}
        >
            {cells.map(renderCell)}
        </div>
    );
};

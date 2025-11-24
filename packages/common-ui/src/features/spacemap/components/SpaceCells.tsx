import { FC, JSX } from 'react';
import { classNames } from 'src/utils/classNames';
import { CellInfo } from '../types/CellInfo';
import { SpaceCell } from './SpaceCell';
import styles from './SpaceCells.module.css';

type SpaceCellProps = {
    gridColumn: string;
    gridRow: string;
};

type Props = {
    columns: number;
    cells: Array<CellInfo | null>;
    className?: string;
    renderOverride?: (id: string, CellComponent: typeof SpaceCell, cellProps: SpaceCellProps) => JSX.Element;
};

export const SpaceCells: FC<Props> = (props) => {
    const { columns, cells, renderOverride } = props;
    const rows = Math.ceil(cells.length / columns);

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
            />
        );
    };

    return (
        <div
            className={classNames(styles.cells, props.className)}
            style={{
                gridTemplateColumns: `repeat(${columns}, calc(var(--cellWidth) * 0.25) calc(var(--cellWidth) * 0.5)) calc(var(--cellWidth) * 0.25)`,
                gridTemplateRows: `repeat(${rows * 2}, calc(var(--cellHeight) / 2))`,
            }}
        >
            {cells.map(renderCell)}
        </div>
    );
};

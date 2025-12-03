import { Rectangle, Vector2D } from 'common-types';

export const horizontalHexSpacing = 1.5;
export const verticalHexSpacing = 1.7320508075688772;

export function drawHex(ctx: CanvasRenderingContext2D, radius: number, numPoints: number) {
    ctx.beginPath();

    let angle, x, y;
    for (let point = 0; point <= numPoints; point++) {
        angle = 2 * Math.PI / 6 * point;
        x = radius * Math.cos(angle);
        y = radius * Math.sin(angle);

        if (point === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
}

export function getClosestCellCenter(x: number, y: number, cellRadius: number = 1): Vector2D {
    const fCol = x * 2 / 3 / cellRadius;
    const fRow = (x - Math.sqrt(3) * y) / -3 / cellRadius;
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

    return {
        x: horizontalHexSpacing * iCol * cellRadius,
        y: verticalHexSpacing * (iRow + iCol / 2) * cellRadius,
    };
}

export function drawHexGrid(
    ctx: CanvasRenderingContext2D,
    bounds: Rectangle,
    cellRadius: number,
    lineWidth: number,
    strokeStyle: string
) {
    let currentCell = getClosestCellCenter(
        bounds.x - cellRadius,
        bounds.y - cellRadius,
        cellRadius
    );

    const insetStartY = currentCell.y;
    const outsetStartY = currentCell.y - cellRadius * verticalHexSpacing / 2;

    let outset = true;
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;

    const maxX = bounds.x + bounds.width + cellRadius;
    const maxY = bounds.y + bounds.height + cellRadius;

    while (currentCell.x < maxX) {
        while (currentCell.y < maxY) {
            ctx.translate(currentCell.x, currentCell.y);

            drawHex(ctx, cellRadius, 3);
            ctx.stroke();

            ctx.translate(-currentCell.x, -currentCell.y);

            currentCell.y += verticalHexSpacing * cellRadius;
        }

        currentCell.x += horizontalHexSpacing * cellRadius;
        currentCell.y = outset
            ? outsetStartY
            : insetStartY;

        outset = !outset;
    }
}

import { Rectangle } from 'common-types';

export const horizontalHexSpacing = 1.7320508075688772;
export const verticalHexSpacing = 1.5;

export function drawHex(ctx: CanvasRenderingContext2D, radius: number, numPoints: number) {
    ctx.beginPath();

    let angle, x, y;
    for (let point = 0; point <= numPoints; point++) {
        angle = 2 * Math.PI / 6 * (point + 0.5);
        x = radius * Math.cos(angle);
        y = radius * Math.sin(angle);

        if (point === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
}

export function getClosestCellCenter(x: number, y: number, cellRadius: number) {
    const fCol = (x * Math.sqrt(3) - y) / 3 / cellRadius;
    const fRow = y * 2 / 3 / cellRadius;
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
        x: horizontalHexSpacing * (iCol + iRow / 2) * cellRadius,
        y: verticalHexSpacing * iRow * cellRadius,
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

    const insetStartX = currentCell.x;
    const outsetStartX = currentCell.x - cellRadius * horizontalHexSpacing / 2;

    let outset = true;
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;

    const maxX = bounds.x + bounds.width + cellRadius;
    const maxY = bounds.y + bounds.height + cellRadius;

    while (currentCell.y < maxY) {
        while (currentCell.x < maxX) {
            ctx.translate(currentCell.x, currentCell.y);

            drawHex(ctx, cellRadius, 3);
            ctx.stroke();

            ctx.translate(-currentCell.x, -currentCell.y);

            currentCell.x += horizontalHexSpacing * cellRadius;
        }

        currentCell.y += verticalHexSpacing * cellRadius;
        currentCell.x = outset
            ? outsetStartX
            : insetStartX;

        outset = !outset;
    }
}

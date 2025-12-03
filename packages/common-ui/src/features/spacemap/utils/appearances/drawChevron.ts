export function drawChevron(
    ctx: CanvasRenderingContext2D,
    mainColor: string,
    _highlight: string
) {
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.moveTo(0.625, 0);
    ctx.lineTo(-0.46875, 0.53125);
    ctx.lineTo(-0.28125, 0);
    ctx.lineTo(-0.46875, -0.53125);
    ctx.closePath();
    ctx.fill();
}

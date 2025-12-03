export function drawCircle(
    ctx: CanvasRenderingContext2D,
    mainColor: string,
    _highlight: string
) {
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 0.5, 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
}

/** A small seeded random number generator, so that an effect looks the same on every frame it's drawn. */
export function seededRandom(seed: number) {
    let state = seed >>> 0;

    return () => {
        state = (state + 0x6D2B79F5) >>> 0;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

const layers = new Map<string, HTMLCanvasElement>();

/** Get an offscreen canvas of the given size. It keeps its content, unless its size changes. */
export function getLayer(name: string, width: number, height: number) {
    let layer = layers.get(name);

    if (!layer) {
        layer = document.createElement('canvas');
        layers.set(name, layer);
    }

    if (layer.width !== width || layer.height !== height) {
        layer.width = width;
        layer.height = height;
    }

    return layer;
}

const glowSize = 96;
const glowSprites = new Map<string, HTMLCanvasElement>();

function getGlowSprite(color: string) {
    let sprite = glowSprites.get(color);

    if (!sprite) {
        sprite = document.createElement('canvas');
        sprite.width = sprite.height = glowSize;

        const center = glowSize / 2;
        const ctx = sprite.getContext('2d')!;
        const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.25, color + 'aa');
        gradient.addColorStop(0.55, color + '33');
        gradient.addColorStop(1, color + '00');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, glowSize, glowSize);

        glowSprites.set(color, sprite);
    }

    return sprite;
}

/** Draw a soft blob of light. The color must be a six digit hex color. This leaves the context's alpha changed. */
export function glow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, alpha: number) {
    if (alpha <= 0 || radius <= 0) {
        return;
    }

    ctx.globalAlpha = Math.min(1, alpha);
    ctx.drawImage(getGlowSprite(color), x - radius, y - radius, radius * 2, radius * 2);
}

/** Draw a straight line. This leaves the context's alpha, stroke style and line width changed. */
export function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, width: number, color: string, alpha: number) {
    if (alpha <= 0 || width <= 0) {
        return;
    }

    ctx.globalAlpha = Math.min(1, alpha);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

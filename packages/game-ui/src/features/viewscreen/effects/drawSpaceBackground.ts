import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { getLayer, glow, seededRandom } from './light';

/** Stars are spread over a square tile of this many pixels, repeated as needed. */
const starTileSize = 2048;

/** How much bigger than the screen the nebula is drawn, so it has room to drift. */
const nebulaMargin = 500;
const nebulaParallax = 0.03;

const starLayers = [0.08, 0.2, 0.45].map((parallax, index) => {
    const random = seededRandom(index * 101 + 7);

    return {
        parallax,
        stars: Array.from({ length: 170 - index * 45 }, () => ({
            x: random() * starTileSize,
            y: random() * starTileSize,
            size: (0.5 + random() * 0.7) * (0.8 + index * 0.45),
            alpha: 0.25 + random() * 0.6,
            twinkle: random() * 6,
            color: random() < 0.15 ? '#ffd9b0' : random() < 0.3 ? '#b8d4ff' : '#ffffff',
        })),
    };
});

const starSprites = new Map<string, HTMLCanvasElement>();

/** Hundreds of stars are drawn every frame, so they're drawn from an image rather than being filled in one by one. */
function getStarSprite(color: string) {
    let sprite = starSprites.get(color);

    if (!sprite) {
        sprite = document.createElement('canvas');
        sprite.width = sprite.height = 8;

        const ctx = sprite.getContext('2d')!;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(4, 4, 4, 0, Math.PI * 2);
        ctx.fill();

        starSprites.set(color, sprite);
    }

    return sprite;
}

let nebulaSize = '';

function getNebula(width: number, height: number) {
    const layer = getLayer('nebula', width, height);
    const size = `${width}x${height}`;

    if (size !== nebulaSize) {
        nebulaSize = size;

        const ctx = layer.getContext('2d')!;
        const random = seededRandom(4242);

        ctx.fillStyle = '#03050c';
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'lighter';

        for (let i = 0; i < 26; i++) {
            const color = i % 3 === 0 ? '#2a1a55' : i % 3 === 1 ? '#0d3350' : '#3a1630';
            glow(ctx, random() * width, random() * height, (0.18 + random() * 0.35) * Math.max(width, height), color, 0.13);
        }

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
    }

    return layer;
}

function wrap(value: number, size: number) {
    return ((value % size) + size) % size;
}

/** Draw deep space: a dim nebula and layers of stars, drifting at different speeds as the view moves. */
export function drawSpaceBackground(ctx: CanvasRenderingContext2D, center: Vector2D, cellRadius: number, time: number) {
    const { width, height } = ctx.canvas;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;

    const nebulaX = wrap(center.x * cellRadius * nebulaParallax, nebulaMargin / 2);
    const nebulaY = wrap(center.y * cellRadius * nebulaParallax, nebulaMargin / 2);
    ctx.drawImage(getNebula(width + nebulaMargin, height + nebulaMargin), -nebulaX, -nebulaY);

    for (const layer of starLayers) {
        for (const star of layer.stars) {
            const x = wrap(star.x - center.x * cellRadius * layer.parallax, starTileSize);
            const y = wrap(star.y - center.y * cellRadius * layer.parallax, starTileSize);

            if (x <= width && y <= height) {
                ctx.globalAlpha = star.alpha * (0.85 + 0.15 * Math.sin(time * 0.002 + star.twinkle));
                ctx.drawImage(getStarSprite(star.color), x - star.size, y - star.size, star.size * 2, star.size * 2);
            }
        }
    }

    ctx.restore();
}

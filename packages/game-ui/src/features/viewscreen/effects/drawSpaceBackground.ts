import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { getLayer, glow, seededRandom } from './light';

/** Stars are spread over a square tile of this many pixels, repeated as needed. */
const starTileSize = 2048;

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

let nebulaSize = 0;

/**
 * A square nebula tile that repeats seamlessly, so it can drift forever without ever jumping.
 * Each blob is also drawn a tile's width away in every direction, so whatever crosses one edge comes back in at the other.
 */
function getNebula(size: number) {
    const layer = getLayer('nebula', size, size);

    if (size !== nebulaSize) {
        nebulaSize = size;

        const ctx = layer.getContext('2d')!;
        const random = seededRandom(4242);

        ctx.fillStyle = '#03050c';
        ctx.fillRect(0, 0, size, size);
        ctx.globalCompositeOperation = 'lighter';

        for (let i = 0; i < 26; i++) {
            const color = i % 3 === 0 ? '#2a1a55' : i % 3 === 1 ? '#0d3350' : '#3a1630';
            const x = random() * size;
            const y = random() * size;
            const radius = (0.18 + random() * 0.35) * size;

            for (const offsetX of [-size, 0, size]) {
                for (const offsetY of [-size, 0, size]) {
                    glow(ctx, x + offsetX, y + offsetY, radius, color, 0.13);
                }
            }
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

    // The tile is at least as big as the screen, so a 2x2 block of tiles always covers it.
    const nebulaSize = Math.max(width, height, 1);
    const nebula = getNebula(nebulaSize);
    const nebulaX = wrap(center.x * cellRadius * nebulaParallax, nebulaSize);
    const nebulaY = wrap(center.y * cellRadius * nebulaParallax, nebulaSize);

    for (const tileX of [-nebulaX, nebulaSize - nebulaX]) {
        for (const tileY of [-nebulaY, nebulaSize - nebulaY]) {
            if (tileX < width && tileY < height) {
                ctx.drawImage(nebula, tileX, tileY);
            }
        }
    }

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

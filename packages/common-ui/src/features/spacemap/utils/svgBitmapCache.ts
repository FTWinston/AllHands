import { svgStrings } from '../../../objects/strings';
import type { ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';

const BITMAP_SIZE = 128;

const cache = new Map<string, ImageBitmap>();
const loading = new Set<string>();

function cacheKey(appearance: ObjectAppearance, mainColor: string, highlight: string): string {
    return `${appearance}-${mainColor}-${highlight}`;
}

export function getSvgBitmap(
    appearance: ObjectAppearance,
    mainColor: string,
    highlight: string
): ImageBitmap | undefined {
    const key = cacheKey(appearance, mainColor, highlight);
    const cached = cache.get(key);
    if (cached) {
        return cached;
    }
    if (!loading.has(key)) {
        loading.add(key);
        loadBitmap(appearance, mainColor, highlight, key);
    }
    return undefined;
}

async function loadBitmap(
    appearance: ObjectAppearance,
    mainColor: string,
    highlight: string,
    key: string
): Promise<void> {
    try {
        const raw = svgStrings[appearance];
        const colored = raw
            .replace('<svg ', `<svg width="${BITMAP_SIZE}" height="${BITMAP_SIZE}" `)
            .replace(/currentColor/g, mainColor)
            .replace(/var\(--highlight\)/g, highlight);

        const blob = new Blob([colored], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        try {
            const img = new Image(BITMAP_SIZE, BITMAP_SIZE);
            img.src = url;
            await img.decode();
            const bitmap = await createImageBitmap(img);
            cache.set(key, bitmap);
        } finally {
            URL.revokeObjectURL(url);
        }
    } finally {
        loading.delete(key);
    }
}

export function preloadSvgBitmaps(
    appearances: ObjectAppearance[],
    colorPairs: Array<[string, string]>
): void {
    for (const appearance of appearances) {
        for (const [mainColor, highlight] of colorPairs) {
            getSvgBitmap(appearance, mainColor, highlight);
        }
    }
}

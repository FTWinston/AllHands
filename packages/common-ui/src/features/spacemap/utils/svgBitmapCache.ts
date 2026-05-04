import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { svgStrings } from '../../../objects/strings';
import { getColors } from './relationshipColors';
import type { ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';
import type { ScenarioConfig } from 'common-data/types/ScenarioConfig';

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

export function preloadFromScenario(config: ScenarioConfig): void {
    const appearanceColorPairs = config.encounters.flatMap(encounter =>
        encounter.enemies.map(enemy => [enemy.appearance, enemy.relationship] as const)
    );

    const unique = new Map<string, [ObjectAppearance, RelationshipType]>();
    for (const [appearance, relationship] of appearanceColorPairs) {
        const key = `${appearance}-${relationship}`;
        if (!unique.has(key)) {
            unique.set(key, [appearance, relationship]);
        }
    }

    for (const [appearance, relationship] of unique.values()) {
        const colorPair = getColors(relationship);
        getSvgBitmap(appearance, colorPair[0], colorPair[1]);
    }
}

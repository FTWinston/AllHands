import { shipAppearances, type ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';

/**
 * The svg to draw an object on a space map. A ship's wireframe is too fine for the size it's drawn there, moving and turning,
 * so its hull gets a light fill, its details get heavier lines, and its fine construction marks are left off.
 * A shape in the hull group with `stroke="none"` shows only as part of this fill, for where the hull's lines leave a gap.
 */
export function getMapSvg(raw: string, appearance: ObjectAppearance): string {
    if (!(shipAppearances as readonly ObjectAppearance[]).includes(appearance)) {
        return raw;
    }

    const open = raw.match(/<svg[^>]*>/)?.[0];
    const [hull, details] = [...raw.matchAll(/<g stroke-width="\d+">([\s\S]*?)<\/g>/g)].map(match => match[1]);

    if (!open || hull === undefined || details === undefined) {
        throw new Error(`Ship design isn't in the expected form: ${appearance}`);
    }

    return `${open}<g stroke-width="14" fill="var(--highlight)">${hull}</g><g stroke-width="12">${details}</g></svg>`;
}

import { shipAppearances, type ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';

/**
 * How to draw ship designs on a space map, where a wireframe is too fine for the size it's drawn at, moving and turning.
 * A filled ship keeps its details. A silhouette has only its hull's shape, for a simpler view.
 */
export type ShipMapStyle = 'filled' | 'silhouette';

/**
 * Every ship's drawing labels its groups of lines as hull, details and marks (the fine construction marks), so these can restyle them.
 * A shape in the hull group with `stroke="none"` shows only when filled, for where the hull's lines don't enclose the right area.
 * A detail labelled as structure is part of the ship's shape, such as the spokes across a hollow ring, so silhouettes keep it too.
 */
const shipMapStyles: Record<ShipMapStyle, string> = {
    filled: '.marks{display:none}.hull{stroke-width:14;fill:var(--highlight)}.details{stroke-width:12}.structure{fill:var(--highlight)}',
    silhouette: '.marks,.details>:not(.structure){display:none}.hull,.structure{stroke:var(--highlight);fill:var(--highlight)}.structure{stroke-width:16}',
};

/** The svg to draw an object on a space map. Only ship designs have map styles; other objects are drawn as they are. */
export function getMapSvg(raw: string, appearance: ObjectAppearance, style: ShipMapStyle): string {
    if (!(shipAppearances as readonly ObjectAppearance[]).includes(appearance)) {
        return raw;
    }

    const contentStart = raw.indexOf('>') + 1;
    return `${raw.slice(0, contentStart)}<style>${shipMapStyles[style]}</style>${raw.slice(contentStart)}`;
}

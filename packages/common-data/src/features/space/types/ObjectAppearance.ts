import { sharedContent } from 'content/content.shared';
import { mergeSharedContent, type MergedAppearances } from '../../../content/SharedContent';
import type { ShipSize } from './AppearanceDefinition';

type AllAppearances = MergedAppearances<(typeof sharedContent)[number]>;

/**
 * Every ship drawing there is, with its size. Each is defined in the `ships/*.shared.ts` file of the content folder whose designs use it
 * (or `content/general/appearances` for those no design uses yet), with an svg of the same name beside it.
 */
export const shipAppearanceDefinitions = mergeSharedContent(sharedContent, 'appearances') as AllAppearances;

/** The name of a ship drawing, which a ship design uses as its appearance. */
export type ShipAppearance = Extract<keyof AllAppearances, string>;

/** Every ship drawing's name. */
export const shipAppearances = Object.keys(shipAppearanceDefinitions) as ShipAppearance[];

/** A chevron for the crew's own ship, a circle for anything without a shape of its own, or a ship drawing. */
export type ObjectAppearance = 'chevron' | 'circle' | ShipAppearance;

/** Whether the given appearance is a ship drawing, rather than the crew's chevron or a plain circle. */
export function isShipAppearance(appearance: string): appearance is ShipAppearance {
    return Object.hasOwn(shipAppearanceDefinitions, appearance);
}

/** How big a ship of the given appearance is, or undefined for anything that isn't a ship drawing. */
export function getShipSize(appearance: ObjectAppearance): ShipSize | undefined {
    return isShipAppearance(appearance) ? shipAppearanceDefinitions[appearance].size : undefined;
}

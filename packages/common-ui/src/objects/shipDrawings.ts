import type { ShipAppearance } from 'common-data/features/space/types/ObjectAppearance';
import type { FC, SVGProps } from 'react';

export type SvgComponent = FC<SVGProps<SVGSVGElement>>;

/** How a ship drawing is shown: as an icon, as the svg the space map draws a bitmap from, and the outline its shields are drawn along. */
export interface ShipDrawing {
    Icon: SvgComponent;
    /** The drawing's svg, as text. */
    svg: string;
    /** The outline its shields are drawn along, starting at its nose (generated beside the drawing: see `shieldOutlines.test.ts`). */
    shieldOutline: string;
}

/** Every registered ship drawing, by appearance. Filled by `registerUiContent`. */
const drawings = new Map<string, ShipDrawing>();

/** Register the given ship drawings, by appearance. */
export function registerShipDrawings(newDrawings: Readonly<Record<string, ShipDrawing>>) {
    for (const [appearance, drawing] of Object.entries(newDrawings)) {
        if (drawings.has(appearance)) {
            throw new Error(`Ship drawing registered twice: ${appearance}`);
        }
        drawings.set(appearance, drawing);
    }
}

/** The drawing for the given appearance, or undefined if none is registered. */
export function getShipDrawing(appearance: ShipAppearance): ShipDrawing | undefined {
    return drawings.get(appearance);
}

import { Keyframes } from './Keyframes';
import { Position } from './Position';
import { ShipAppearance } from './ShipAppearance';

export type ItemColor = 'enemy' | 'friendly' | 'neutral' | 'self';

export type MapItem = {
    id: string;
    position: Keyframes<Position>;
    size: number;
    appearance: ShipAppearance; // TODO: These are probably too complicated. Go for something simpler, which includes non-ship items.
    color: ItemColor;
};

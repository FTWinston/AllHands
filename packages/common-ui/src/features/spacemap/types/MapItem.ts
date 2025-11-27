import { Keyframes, Position, ShipAppearance } from 'common-types';

export type MapItem = {
    id: string;
    position: Keyframes<Position>;
    size: number;
    appearance: ShipAppearance; // TODO: These are probably too complicated. Go for something simpler, which includes non-ship items.
};

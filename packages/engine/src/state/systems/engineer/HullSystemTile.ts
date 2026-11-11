import { type } from '@colyseus/schema';
import { HullSystemTileInfo } from 'common-data/features/space/types/GameObjectInfo';
import { EngineerSystemTile } from './EngineerSystemTile';
import type { HullState } from '../HullState';

/** The hull's engineer tile, which also has the hull's shields, and their capacity, so that stays known while the shields are down. */
export class HullSystemTile extends EngineerSystemTile implements HullSystemTileInfo {
    constructor(hullState: HullState) {
        super(hullState, 'hull');

        // Set here rather than when the hull links to this tile, as that happens in the base constructor, before this class's fields are initialised.
        this.setMaxShield(hullState.maxShield);
    }

    declare system: 'hull';
    @type('uint16') readonly shield: number = 0;
    @type('uint16') readonly maxShield: number = 0;

    /** Update the hull's shield capacity, and cap the shields to it. */
    setMaxShield(maxShield: number) {
        (this as { maxShield: number }).maxShield = maxShield;
        this.setShield(this.shield);
    }

    /** Set the shields' level, within their capacity. */
    setShield(shield: number) {
        (this as { shield: number }).shield = Math.max(0, Math.min(shield, this.maxShield));
        this.scienceScanDataChanged.invoke();
    }
}

import { ArraySchema, type } from '@colyseus/schema';
import { ScannedEngineerInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ListenableEvent } from 'src/classes/ListenableEvent';
import { ScannedEngineerTileState } from './ScannedEngineerTileState';
import { ScannedSystemState } from './ScannedSystemState';
import type { EngineerState } from '../engineer/EngineerState';

export class ScannedEngineerState extends ScannedSystemState<EngineerState> implements ScannedEngineerInfo {
    @type([ScannedEngineerTileState]) engineerTiles = new ArraySchema<ScannedEngineerTileState>();

    // The tiles have every system's power and health, but the engineer's own hand changes on the engineer system itself.
    protected override get changeEvents(): ListenableEvent[] {
        return [
            ...super.changeEvents,
            ...this.source.systems.map(tile => tile.scienceScanDataChanged),
        ];
    }

    protected override copySystemData(source: EngineerState) {
        // Make the tiles be the same length.
        while (this.engineerTiles.length < source.systems.length) {
            this.engineerTiles.push(new ScannedEngineerTileState('hull'));
        }
        while (this.engineerTiles.length > source.systems.length) {
            this.engineerTiles.pop();
        }

        for (let i = 0; i < source.systems.length; i++) {
            const src = source.systems[i];
            const dest = this.engineerTiles[i];
            dest.system = src.system;
            dest.power = src.power;
            dest.health = src.health;
        }
    }
}

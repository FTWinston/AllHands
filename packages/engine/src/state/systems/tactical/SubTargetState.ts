import { Schema, type } from '@colyseus/schema';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { SubTargetInfo } from 'common-data/features/space/types/GameObjectInfo';

export class SubTargetState extends Schema implements SubTargetInfo {
    constructor(id: string, system: ShipSystem, aspect?: number | null) {
        super();
        this.id = id;
        this.system = system;
        this.aspect = aspect ?? null;
    }

    @type('string') id: string;
    @type('string') system: ShipSystem;
    @type('number') aspect: number | null = null;
}

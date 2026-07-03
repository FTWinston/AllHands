import { MapSchema, Schema, type } from '@colyseus/schema';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';

export class FactionState extends Schema {
    constructor(id: string) {
        super();
        this.id = id;
    }

    @type('string') readonly id: string;

    /** Relationship of this faction toward other factions, keyed by faction id. */
    @type({ map: 'uint8' }) readonly relations = new MapSchema<RelationshipType>();
}

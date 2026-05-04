import { ArraySchema, Schema, type } from '@colyseus/schema';
import { Vulnerability } from 'common-data/features/ships/types/Vulnerability';
import { TacticalTargetInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';

export class TacticalTargetState extends Schema implements TacticalTargetInfo {
    constructor(id: string, name: string, appearance: ObjectAppearance) {
        super();

        this.id = id;
        this.name = name;
        this.appearance = appearance;
    }

    @type('string') readonly id: string;
    @type('string') readonly name: string;
    @type('string') appearance: ObjectAppearance;
    @type(['string']) vulnerabilities = new ArraySchema<Vulnerability>();
    @type(['string']) slotNoFireReasons = new ArraySchema<string | null>();
}

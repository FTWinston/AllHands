import { type, view } from '@colyseus/schema';
import { helmClientRole, sensorClientRole, tacticalClientRole, engineerClientRole } from 'common-data/features/ships/types/CrewRole';
import { ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';
import { Position } from 'common-data/features/space/types/Position';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { EngineerState } from './EngineerState';
import { HelmState } from './HelmState';
import { MobileObject } from './MobileObject';
import { SensorState } from './SensorState';
import { TacticalState } from './TacticalState';

export abstract class Ship extends MobileObject {
    constructor(
        id: string,
        relationship: RelationshipType,
        appearance: ObjectAppearance,
        position: Position) {
        super(id, relationship, appearance, position);
    }

    @view(helmClientRole) @type(HelmState) helmState: HelmState = new HelmState();
    @view(sensorClientRole) @type(SensorState) sensorState: SensorState = new SensorState();
    @view(tacticalClientRole) @type(TacticalState) tacticalState: TacticalState = new TacticalState();
    @view(engineerClientRole) @type(EngineerState) engineerState: EngineerState = new EngineerState();

    protected updateMotion(_currentTime: number) {
        // TODO: this
    }
}

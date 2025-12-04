import { Schema, type, view } from '@colyseus/schema';
import { helmClientRole, sensorClientRole, tacticalClientRole, engineerClientRole } from 'common-data/features/ships/types/CrewRole';
import { CrewState } from './CrewState';
import { EngineerState } from './EngineerState';
import { HelmState } from './HelmState';
import { SensorState } from './SensorState';
import { TacticalState } from './TacticalState';

export class ShipState extends Schema {
    crew: CrewState | null = null;

    @view(helmClientRole) @type(HelmState) helmState: HelmState = new HelmState();
    @view(sensorClientRole) @type(SensorState) sensorState: SensorState = new SensorState();
    @view(tacticalClientRole) @type(TacticalState) tacticalState: TacticalState = new TacticalState();
    @view(engineerClientRole) @type(EngineerState) engineerState: EngineerState = new EngineerState();
}

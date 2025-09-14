import { Schema, type, view } from '@colyseus/schema';
import { helmClientRole, sensorClientRole, tacticalClientRole, engineerClientRole  } from 'common-types';
import { HelmState } from './HelmState';
import { SensorState } from './SensorState';
import { TacticalState } from './TacticalState';
import { EngineerState } from './EngineerState';
import { CrewState } from './CrewState';

export class ShipState extends Schema {
    crew: CrewState | null = null;
    
    @view(helmClientRole) @type(HelmState) helmState: HelmState = new HelmState();
    @view(sensorClientRole) @type(SensorState) sensorState: SensorState = new SensorState();
    @view(tacticalClientRole) @type(TacticalState) tacticalState: TacticalState = new TacticalState();
    @view(engineerClientRole) @type(EngineerState) engineerState: EngineerState = new EngineerState();
}

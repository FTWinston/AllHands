import { Schema, type, MapSchema, view } from '@colyseus/schema';
import { CrewRole, noClientRole, shipClientRole, helmClientRole, sensorClientRole, tacticalClientRole, engineerClientRole, CrewRoleName, getRoleName  } from 'common-types';
import { HelmState } from './HelmState';
import { SensorState } from './SensorState';
import { TacticalState } from './TacticalState';
import { EngineerState } from './EngineerState';

export class ShipState extends Schema {
    constructor(ownerId: string, shipId: string) {
        super();
        this.ownerId = ownerId;
        this.shipId = shipId;
    }

    @type('string') shipId: string; // unique ID of the ship
    @view(noClientRole) @type('string') ownerId: string; // sessionId of the ship client

    @view() @type({ map: 'string' }) crewByRole = new MapSchema<string, CrewRoleName>();
    @view(shipClientRole) @type({ map: 'uint8' }) rolesByCrew = new MapSchema<CrewRole | '', string>();

    @view(helmClientRole) @type(HelmState) helmState: HelmState = new HelmState();
    @view(sensorClientRole) @type(SensorState) sensorState: SensorState = new SensorState();
    @view(tacticalClientRole) @type(TacticalState) tacticalState: TacticalState = new TacticalState();
    @view(engineerClientRole) @type(EngineerState) engineerState: EngineerState = new EngineerState();

    tryAssignRole(crewId: string, role: CrewRole): boolean {
        const roleName = getRoleName(role);
        const existingClientInRole = this.crewByRole.get(roleName);

        if (existingClientInRole === crewId) {
            return true; // No change.
        } else if (existingClientInRole) {
            return false; // Role already taken.
        }

        const previousRole = this.rolesByCrew.get(crewId);
        if (previousRole) {
            this.crewByRole.delete(getRoleName(previousRole));
        }

        this.crewByRole.set(roleName, crewId);
        this.rolesByCrew.set(crewId, role);

        return true;
    }

    unassignRole(crewId: string): void {
        const previousRole = this.rolesByCrew.get(crewId);
        if (previousRole) {
            this.crewByRole.delete(getRoleName(previousRole));
            this.rolesByCrew.set(crewId, '');
        }
    }
}

import { Schema, type, view, MapSchema } from '@colyseus/schema';
import { CrewRole, helmClientRole, sensorClientRole as sensorsClientRole, tacticalClientRole, engineerClientRole, shipClientRole } from 'common-data/features/ships/types/CrewRole';
import { GameRoom } from '../classes/GameRoom';
import { PlayerShip } from './PlayerShip';

export class CrewState extends Schema {
    constructor(shipClientId: string, crewId: string) {
        super();
        this.shipClientId = shipClientId;
        this.crewId = crewId;
    }

    crewId: string; // unique ID of this crew

    setShip(ship: PlayerShip | null) {
        if (ship) {
            ship.crew = this;
        }

        this.ship = ship;
        this.shipId = ship?.id ?? null;
    }

    ship: PlayerShip | null = null;

    @type('string') shipId: string | null = null;

    shipClientId: string; // sessionId of the ship client

    @view() @type('string') helmClientId: string = '';
    @view() @type('string') tacticalClientId: string = '';
    @view() @type('string') sensorsClientId: string = '';
    @view() @type('string') engineerClientId: string = '';

    @view() @type({ map: 'boolean' }) crewReady = new MapSchema<boolean>(); // Map of crew member client IDs to ready status

    tryAdd(crewClientId: string): boolean {
        if (this.crewReady.size >= 4) {
            return false;
        }

        this.crewReady.set(crewClientId, false);
        return true;
    }

    remove(crewClientId: string): void {
        this.crewReady.delete(crewClientId);
        this.unassignRole(crewClientId);
    }

    isUnused() {
        return this.crewReady.size === 0 && this.shipClientId === '';
    }

    /**
     * Assign to the requested role if it's unoccupied.
     * Return false if occupied by another crew member.
     * Return true if already in the requested role.
     */
    tryAssignRole(clientId: string, role: CrewRole): boolean {
        if (role === helmClientRole) {
            if (this.helmClientId) {
                return this.helmClientId === clientId;
            }
            this.helmClientId = clientId;
        } else if (role === tacticalClientRole) {
            if (this.tacticalClientId) {
                return this.tacticalClientId === clientId;
            }
            this.tacticalClientId = clientId;
        } else if (role === sensorsClientRole) {
            if (this.sensorsClientId) {
                return this.sensorsClientId === clientId;
            }
            this.sensorsClientId = clientId;
        } else if (role === engineerClientRole) {
            if (this.engineerClientId) {
                return this.engineerClientId === clientId;
            }
            this.engineerClientId = clientId;
        } else {
            return false;
        }

        // Unassign from any existing roles.
        if (clientId === this.helmClientId && role !== helmClientRole) {
            this.helmClientId = '';
        }
        if (clientId === this.tacticalClientId && role !== tacticalClientRole) {
            this.tacticalClientId = '';
        }
        if (clientId === this.sensorsClientId && role !== sensorsClientRole) {
            this.sensorsClientId = '';
        }
        if (clientId === this.engineerClientId && role !== engineerClientRole) {
            this.engineerClientId = '';
        }

        return true;
    }

    unassignRole(crewClientId: string): void {
        if (crewClientId === this.helmClientId) {
            this.helmClientId = '';
        }
        if (crewClientId === this.tacticalClientId) {
            this.tacticalClientId = '';
        }
        if (crewClientId === this.sensorsClientId) {
            this.sensorsClientId = '';
        }
        if (crewClientId === this.engineerClientId) {
            this.engineerClientId = '';
        }
    }

    isReady(): boolean {
        if (!this.helmClientId || !this.tacticalClientId || !this.sensorsClientId || !this.engineerClientId) {
            return false;
        }

        if (this.crewReady.size < 4) {
            return false;
        }

        for (const ready of this.crewReady.values()) {
            if (!ready) {
                return false;
            }
        }

        return true;
    }

    /** Add the ship to each client's view, in the correct view role. */
    assignToShip(room: GameRoom) {
        if (this.ship === null) {
            throw new Error(`Crew ${this.crewId} has no ship to assign to`);
        }

        const shipClient = room.clients.getById(this.shipClientId);
        if (shipClient?.view) {
            shipClient.view.add(this.ship, shipClientRole);
        }

        const helmClient = room.clients.getById(this.helmClientId);
        if (helmClient?.view) {
            helmClient.view.add(this.ship, helmClientRole);
        }

        const tacticalClient = room.clients.getById(this.tacticalClientId);
        if (tacticalClient?.view) {
            tacticalClient.view.add(this.ship, tacticalClientRole);
        }

        const sensorsClient = room.clients.getById(this.sensorsClientId);
        if (sensorsClient?.view) {
            sensorsClient.view.add(this.ship, sensorsClientRole);
        }

        const engineerClient = room.clients.getById(this.engineerClientId);
        if (engineerClient?.view) {
            engineerClient.view.add(this.ship, engineerClientRole);
        }
    }

    /** Remove the ship from each client's view, allowing roles to change. */
    unassignFromShip(room: GameRoom) {
        if (this.ship === null) {
            throw new Error(`Crew ${this.crewId} has no ship to unassign from`);
        }

        const shipClient = room.clients.getById(this.shipClientId);
        if (shipClient?.view) {
            shipClient.view.remove(this.ship, shipClientRole);
        }

        const helmClient = room.clients.getById(this.helmClientId);
        if (helmClient?.view) {
            helmClient.view.remove(this.ship, helmClientRole);
        }

        const tacticalClient = room.clients.getById(this.tacticalClientId);
        if (tacticalClient?.view) {
            tacticalClient.view.remove(this.ship, tacticalClientRole);
        }

        const sensorsClient = room.clients.getById(this.sensorsClientId);
        if (sensorsClient?.view) {
            sensorsClient.view.remove(this.ship, sensorsClientRole);
        }

        const engineerClient = room.clients.getById(this.engineerClientId);
        if (engineerClient?.view) {
            engineerClient.view.remove(this.ship, engineerClientRole);
        }
    }
}

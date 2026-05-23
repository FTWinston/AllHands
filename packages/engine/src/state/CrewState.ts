import { ClientArray } from '@colyseus/core';
import { Schema, type, view, MapSchema } from '@colyseus/schema';
import { CrewRole, ownHelmClientRole, ownScienceClientRole as scienceClientRole, ownTacticalClientRole, ownEngineerClientRole, ownShipClientRole, otherShipClientRole, otherHelmClientRole, otherTacticalClientRole, otherScienceClientRole } from 'common-data/features/ships/types/CrewRole';
import { GameObject } from './GameObject';
import { GameState } from './GameState';
import { PlayerShip } from './PlayerShip';
import { Ship } from './Ship';

export class CrewState extends Schema {
    constructor(clients: ClientArray, shipClientId: string, crewId: string) {
        super();
        this.clients = clients;
        this.shipClientId = shipClientId;
        this.crewId = crewId;
    }

    crewId: string; // unique ID of this crew

    private clients: ClientArray;

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
    @view() @type('string') scienceClientId: string = '';
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
        if (role === ownHelmClientRole) {
            if (this.helmClientId) {
                return this.helmClientId === clientId;
            }
            this.helmClientId = clientId;
        } else if (role === ownTacticalClientRole) {
            if (this.tacticalClientId) {
                return this.tacticalClientId === clientId;
            }
            this.tacticalClientId = clientId;
        } else if (role === scienceClientRole) {
            if (this.scienceClientId) {
                return this.scienceClientId === clientId;
            }
            this.scienceClientId = clientId;
        } else if (role === ownEngineerClientRole) {
            if (this.engineerClientId) {
                return this.engineerClientId === clientId;
            }
            this.engineerClientId = clientId;
        } else {
            return false;
        }

        // Unassign from any existing roles.
        if (clientId === this.helmClientId && role !== ownHelmClientRole) {
            this.helmClientId = '';
        }
        if (clientId === this.tacticalClientId && role !== ownTacticalClientRole) {
            this.tacticalClientId = '';
        }
        if (clientId === this.scienceClientId && role !== scienceClientRole) {
            this.scienceClientId = '';
        }
        if (clientId === this.engineerClientId && role !== ownEngineerClientRole) {
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
        if (crewClientId === this.scienceClientId) {
            this.scienceClientId = '';
        }
        if (crewClientId === this.engineerClientId) {
            this.engineerClientId = '';
        }
    }

    isReady(): boolean {
        if (!this.helmClientId || !this.tacticalClientId || !this.scienceClientId || !this.engineerClientId) {
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

    /**
     * Add a game object to the viewscreen, helm and tactical clients' views.
     * (Only add to tactical & science if it's a ship, since that's currently the only thing that can be targeted.)
     */
    addObjectToViews(object: GameObject): void {
        if (!this.clients || object === this.ship) {
            return;
        }

        const shipClient = this.clients.getById(this.shipClientId);
        if (shipClient?.view && !shipClient.view.has(object)) {
            shipClient.view.add(object, otherShipClientRole);
        }

        const helmClient = this.clients.getById(this.helmClientId);
        if (helmClient?.view && !helmClient.view.has(object)) {
            helmClient.view.add(object, otherHelmClientRole);
        }

        const tacticalClient = this.clients.getById(this.tacticalClientId);
        if (tacticalClient?.view && !tacticalClient.view.has(object) && object instanceof Ship) {
            tacticalClient.view.add(object, otherTacticalClientRole);
        }

        const scienceClient = this.clients.getById(this.scienceClientId);
        if (scienceClient?.view && !scienceClient.view.has(object) && object instanceof Ship) {
            scienceClient.view.add(object, otherScienceClientRole);
        }
    }

    /** Remove a game object from all client views on this crew. */
    removeObjectFromViews(object: GameObject): void {
        if (!this.clients) {
            return;
        }

        const shipClient = this.clients.getById(this.shipClientId);
        if (shipClient?.view) {
            shipClient.view.remove(object);
        }

        const helmClient = this.clients.getById(this.helmClientId);
        if (helmClient?.view) {
            helmClient.view.remove(object);
        }

        const tacticalClient = this.clients.getById(this.tacticalClientId);
        if (tacticalClient?.view) {
            tacticalClient.view.remove(object);
        }

        const scienceClient = this.clients.getById(this.scienceClientId);
        if (scienceClient?.view) {
            scienceClient.view.remove(object);
        }

        const engineerClient = this.clients.getById(this.engineerClientId);
        if (engineerClient?.view) {
            engineerClient.view.remove(object);
        }
    }

    /** Add the ship to each client's view, in the correct view role. */
    assignToShip(state: GameState) {
        if (this.ship === null) {
            throw new Error(`Crew ${this.crewId} has no ship to assign to`);
        }

        const shipClient = this.clients.getById(this.shipClientId);
        if (shipClient?.view) {
            shipClient.view.add(this.ship, ownShipClientRole);
        }

        const helmClient = this.clients.getById(this.helmClientId);
        if (helmClient?.view) {
            helmClient.view.add(this.ship, ownHelmClientRole);
        }

        const tacticalClient = this.clients.getById(this.tacticalClientId);
        if (tacticalClient?.view) {
            tacticalClient.view.add(this.ship, ownTacticalClientRole);
        }

        const scienceClient = this.clients.getById(this.scienceClientId);
        if (scienceClient?.view) {
            scienceClient.view.add(this.ship, scienceClientRole);
        }

        const engineerClient = this.clients.getById(this.engineerClientId);
        if (engineerClient?.view) {
            engineerClient.view.add(this.ship, ownEngineerClientRole);
        }

        // Add all game objects to the viewscreen, helm and tactical clients' views.
        for (const object of state.objects.values()) {
            this.addObjectToViews(object);
        }

        // Notify all clients about the ship assignment.
        this.sendShipMessage(this.ship!.id);
    }

    /** Remove the ship from each client's view, allowing roles to change. */
    unassignFromShip(state: GameState) {
        if (this.ship === null) {
            throw new Error(`Crew ${this.crewId} has no ship to unassign from`);
        }

        const shipClient = this.clients.getById(this.shipClientId);
        if (shipClient?.view) {
            shipClient.view.remove(this.ship, ownShipClientRole);
        }

        const helmClient = this.clients.getById(this.helmClientId);
        if (helmClient?.view) {
            helmClient.view.remove(this.ship, ownHelmClientRole);
        }

        const tacticalClient = this.clients.getById(this.tacticalClientId);
        if (tacticalClient?.view) {
            tacticalClient.view.remove(this.ship, ownTacticalClientRole);
        }

        const scienceClient = this.clients.getById(this.scienceClientId);
        if (scienceClient?.view) {
            scienceClient.view.remove(this.ship, scienceClientRole);
        }

        const engineerClient = this.clients.getById(this.engineerClientId);
        if (engineerClient?.view) {
            engineerClient.view.remove(this.ship, ownEngineerClientRole);
        }

        // Remove all game objects from all client views.
        for (const object of state.objects.values()) {
            this.removeObjectFromViews(object);
        }

        // Notify all clients about the ship unassignment.
        this.sendShipMessage(null);
    }

    /** Send a 'ship' message with the given ship ID to all clients on this crew. */
    private sendShipMessage(shipId: string | null) {
        const clientIds = [
            this.shipClientId,
            this.helmClientId,
            this.tacticalClientId,
            this.scienceClientId,
            this.engineerClientId,
        ];

        for (const clientId of clientIds) {
            if (clientId) {
                const client = this.clients.getById(clientId);
                client?.send('ship', { shipId });
            }
        }
    }
}

import { ClientArray } from '@colyseus/core';
import { Schema, type, view, MapSchema } from '@colyseus/schema';
import { CrewRole, helmClientRole, sensorClientRole as sensorsClientRole, tacticalClientRole, engineerClientRole, shipClientRole } from 'common-data/features/ships/types/CrewRole';
import { GameObject } from './GameObject';
import { GameState } from './GameState';
import { PlayerShip } from './PlayerShip';

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

    /** Add a game object to the viewscreen, helm, and tactical clients' views. */
    addObjectToViews(object: GameObject): void {
        if (!this.clients) {
            return;
        }

        const shipClient = this.clients.getById(this.shipClientId);
        if (shipClient?.view && !shipClient.view.has(object)) {
            shipClient.view.add(object);
        }

        const helmClient = this.clients.getById(this.helmClientId);
        if (helmClient?.view && !helmClient.view.has(object)) {
            helmClient.view.add(object);
        }

        const tacticalClient = this.clients.getById(this.tacticalClientId);
        if (tacticalClient?.view && !tacticalClient.view.has(object)) {
            tacticalClient.view.add(object);
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

        const sensorsClient = this.clients.getById(this.sensorsClientId);
        if (sensorsClient?.view) {
            sensorsClient.view.remove(object);
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
            shipClient.view.add(this.ship, shipClientRole);
        }

        const helmClient = this.clients.getById(this.helmClientId);
        if (helmClient?.view) {
            helmClient.view.add(this.ship, helmClientRole);
        }

        const tacticalClient = this.clients.getById(this.tacticalClientId);
        if (tacticalClient?.view) {
            tacticalClient.view.add(this.ship, tacticalClientRole);
        }

        const sensorsClient = this.clients.getById(this.sensorsClientId);
        if (sensorsClient?.view) {
            sensorsClient.view.add(this.ship, sensorsClientRole);
        }

        const engineerClient = this.clients.getById(this.engineerClientId);
        if (engineerClient?.view) {
            engineerClient.view.add(this.ship, engineerClientRole);
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
            shipClient.view.remove(this.ship, shipClientRole);
        }

        const helmClient = this.clients.getById(this.helmClientId);
        if (helmClient?.view) {
            helmClient.view.remove(this.ship, helmClientRole);
        }

        const tacticalClient = this.clients.getById(this.tacticalClientId);
        if (tacticalClient?.view) {
            tacticalClient.view.remove(this.ship, tacticalClientRole);
        }

        const sensorsClient = this.clients.getById(this.sensorsClientId);
        if (sensorsClient?.view) {
            sensorsClient.view.remove(this.ship, sensorsClientRole);
        }

        const engineerClient = this.clients.getById(this.engineerClientId);
        if (engineerClient?.view) {
            engineerClient.view.remove(this.ship, engineerClientRole);
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
            this.sensorsClientId,
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

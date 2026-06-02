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

    // Tracks which clients currently have the ship in their view, and under what role.
    // Used by assignToShip to do same-tick remove→add when a role changes, keeping both
    // operations in one state patch and avoiding Colyseus 'refId not found' errors.
    private shipViewRoles = new Map<string, number>(); // clientId → role

    setShip(ship: PlayerShip | null) {
        if (ship) {
            ship.crew = this;
        }

        this.ship = ship;
        this.shipId = ship?.id ?? null;

        if (!ship) {
            this.shipViewRoles.clear();
        }
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
        this.shipViewRoles.delete(crewClientId);
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

        // Build the desired (clientId → role) mapping from current crew assignments.
        const newShipViewRoles = new Map<string, number>(
            ([
                [this.shipClientId, ownShipClientRole],
                [this.helmClientId, ownHelmClientRole],
                [this.tacticalClientId, ownTacticalClientRole],
                [this.scienceClientId, scienceClientRole],
                [this.engineerClientId, ownEngineerClientRole],
            ] as [string, number][]).filter(([clientId]) => !!clientId)
        );

        // Remove the ship from clients whose role changed or who no longer hold a role.
        // Doing remove and add in the same call means both land in the same state patch,
        // so the client sees DELETE + full CREATE rather than a stale delta refId.
        for (const [clientId, oldRole] of this.shipViewRoles) {
            if (newShipViewRoles.get(clientId) !== oldRole) {
                this.clients.getById(clientId)?.view?.remove(this.ship, oldRole);
            }
        }

        // Add the ship to clients with a new or changed role.
        for (const [clientId, newRole] of newShipViewRoles) {
            if (this.shipViewRoles.get(clientId) !== newRole) {
                this.clients.getById(clientId)?.view?.add(this.ship, newRole);
            }
        }

        this.shipViewRoles = newShipViewRoles;

        // Add all game objects to the viewscreen, helm and tactical clients' views.
        for (const object of state.objects.values()) {
            this.addObjectToViews(object);
        }

        // Notify all clients about the ship assignment.
        this.sendShipMessage(this.ship!.id);
    }

    /** Signal clients that the ship is unassigned (pause). Does not touch views.
     *
     * The ship is intentionally kept in every client's view during pause to avoid
     * Colyseus 'refId not found' errors. Those errors occur when an object is removed
     * from a view in one state patch and then re-added in a later patch: the client
     * discards the refId tracking on removal, so the subsequent delta is undecodable.
     *
     * Role changes during pause are handled atomically in assignToShip on resume —
     * the old-role remove and the new-role add both land in the same state patch.
     */
    unassignFromShip() {
        if (this.ship === null) {
            throw new Error(`Crew ${this.crewId} has no ship to unassign from`);
        }

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

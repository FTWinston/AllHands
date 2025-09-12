import { Room, Client } from 'colyseus';
import { StateView } from '@colyseus/schema';
import { getRoleName, shipClientRole, type CrewRole } from 'common-types';
import { GameState } from './classes/GameState';
import { ShipState } from './classes/ShipState';

interface JoinOptions {
    type?: 'ship' | 'crew';
    shipId?: string;
}

type ClientData = Required<JoinOptions>;

export class GameRoom extends Room<GameState, unknown, ClientData> {
    maxClients = 5;

    onCreate() {
        this.state = new GameState();

        // Temporary message handler for testing.
        this.onMessage('message', (client, message) => {
            console.log(`Message from ${client.sessionId}:`, message);

            this.broadcast('messages', `(${client.sessionId}) ${message}`);
        });

        this.onMessage('role', (client, role: CrewRole | '') => {
            console.log(`Role message from ${client.sessionId}: ${role}`);

            const shipId = client.userData?.shipId;
            if (!shipId) {
                throw new Error('Client has no ship ID assigned');
            }

            if (this.state.gameStatus === 'active') {
                throw new Error('Cannot change roles while game is active');
            }

            const ship = this.state.ships.get(shipId);

            if (!ship) {
                throw new Error(`Ship ${shipId} not found`);
            }

            client.view?.remove(ship);

            // Update ship's state to account for client's role (change), and
            // give the client visibility of the parts of the ship state they need for their role.
            if (role === '') {
                ship.unassignRole(client.sessionId);
                client.view?.add(ship);
            } else if (ship.tryAssignRole(client.sessionId, role)) {
                client.view?.add(ship, role);
            } else {
                throw new Error(`Role ${role} is already taken on ship ${ship.shipId}`);
            }
        });
    }

    onAuth(_client: Client<ClientData>, options: JoinOptions) {
        // Require a type for every join.
        if (options.type === 'ship') {
            return true;
        }
        if (options.type === 'crew' && typeof options.shipId === 'string') {
            return true;
        }

        console.log('rejecting join with invalid options', options);
        return false;
    }

    onJoin(client: Client<ClientData>, options: JoinOptions) {
        if (options.type === 'ship') {
            this.onShipJoin(client, options.shipId);
        } else if (options.type === 'crew' && options.shipId) {
            this.onCrewJoin(client, options.shipId);
        } else {
            throw new Error('Invalid join options');
        }

    }

    private onShipJoin(client: Client<ClientData>, existingShipId?: string) {
        console.log(`${client.sessionId} ship joined`);

        // Allow reclaiming an existing ship, if present and un-owned.
        const getExistingShip = (id?: string) => {
            if (!id) {
                return undefined;
            }

            const ship = this.state.ships.get(id);
            if (ship && ship.ownerId == '') {
                return ship;
            }
            
            return undefined;
        };

        let shipId: string;
        let ship: ShipState;

        const existingShip = getExistingShip(existingShipId);
            
        if (existingShip && existingShipId) {
            shipId = existingShipId;
            ship = existingShip;
            ship.ownerId = client.sessionId;
        } else {
            shipId = client.sessionId;
            ship = new ShipState(shipId, client.sessionId);
            this.state.ships.set(shipId, ship);
        }
        
        // Tag client so leave logic knows what to do.
        client.userData = {
            type: 'ship',
            shipId,
        };

        client.view = new StateView();
        client.view.add(ship, shipClientRole);

        // Send the ship ID back to the ship client, for providing a link for crew members to join.
        client.send('joined', { shipId });
    }

    private onCrewJoin(client: Client<ClientData>, shipId: string) {
        console.log(`${client.sessionId} crew joined for ship ${shipId}`);

        const ship = this.state.ships.get(shipId);

        if (!ship) {
            throw new Error(`Invalid ship ID: ${shipId}`);
        }
        if (ship.rolesByCrew.size >= 4) {
            throw new Error(`That ship is full: ${shipId}`);
        }

        ship.rolesByCrew.set(client.sessionId, '');
        client.userData = {
            type: 'crew',
            shipId,
        };

        client.view = new StateView();
        client.view.add(ship);

        // Send the ship ID back to the crew client, for reference.
        client.send('joined', { shipId });
    }

    onLeave(client: Client<ClientData>) {
        const shipId = client.userData?.shipId;
        const type = client.userData?.type;

        if (!shipId || !type) {
            console.log(client.sessionId, 'left without proper setup');
            return;
        }

        const ship = this.state.ships.get(shipId);

        if (type === 'ship') {
            this.onShipLeave(client, ship);
        } else {
            this.onCrewLeave(client, ship);
        }
    }

    onShipLeave(client: Client<ClientData>, ship: ShipState | undefined) {
        console.log(client.sessionId, 'ship left!');

        // Mark the ship as unowned, so that its client can reclaim it if they rejoin.
        if (ship) {
            ship.ownerId = '';
        }
    }

    onCrewLeave(client: Client<ClientData>, ship: ShipState | undefined) {
        console.log(client.sessionId, 'crew member left');

        // Remove crew member from their ship.
        if (ship) {
            const role = ship.rolesByCrew.get(client.sessionId);
            ship.rolesByCrew.delete(client.sessionId);
            if (role) {
                ship.crewByRole.delete(getRoleName(role));
            }

            if (ship.rolesByCrew.size === 0 && ship.ownerId === '') {
                // If the ship has no crew and no owner, remove it.
                this.state.ships.delete(ship.shipId);
            }
        }
    }

    onDispose() {
        console.log('room disposing...');
    }
}

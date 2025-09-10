import { ArraySchema } from '@colyseus/schema';
import { Room, Client } from 'colyseus';
import { GameState } from './classes/GameState';
import { ShipState } from './classes/ShipState';

interface JoinOptions {
    role?: 'ship' | 'crew';
    shipId?: string;
}

type ExtendedClient = Client & JoinOptions;

export class GameRoom extends Room<GameState> {
    maxClients = 5;

    onCreate() {
        this.state = new GameState();

        // Temporary message handler for testing.
        this.onMessage('message', (client, message) => {
            console.log(`Message from ${client.sessionId}:`, message);

            this.broadcast('messages', `(${client.sessionId}) ${message}`);
        });
    }


    onAuth(_client: Client, options: JoinOptions) {
        // Require a role for every join.
        if (options.role === 'ship') {
            return true;
        }
        if (options.role === 'crew' && typeof options.shipId === 'string') {
            return true;
        }

        console.log('rejecting join with invalid options', options);
        return false;
    }

    onJoin(client: Client, options: JoinOptions) {
        if (options.role === 'ship') {
            this.onShipJoin(client, options.shipId);
        } else if (options.role === 'crew' && options.shipId) {
            this.onCrewJoin(client, options.shipId);
        } else {
            throw new Error('Invalid join options');
        }
    }

    private onShipJoin(client: Client, existingShipId?: string) {
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
        } else {
            shipId = client.sessionId;
            ship = new ShipState();
            this.state.ships.set(shipId, ship);
        }
        
        ship.ownerId = client.sessionId;

        // Tag client so leave logic knows what to do.
        (client as ExtendedClient).shipId = shipId;
        (client as ExtendedClient).role = 'ship';

        // Send the ship ID back to the ship client, for providing a link for crew members to join.
        client.send('joined', { shipId });
    }

    private onCrewJoin(client: Client, shipId: string) {
        console.log(`${client.sessionId} crew joined for ship ${shipId}`);

        const ship = this.state.ships.get(shipId);

        if (!ship) {
            throw new Error(`Invalid ship ID: ${shipId}`);
        }
        if (ship.crew.length >= 4) {
            throw new Error(`That ship is full: ${shipId}`);
        }

        ship.crew.push(client.sessionId);
        (client as ExtendedClient).shipId = shipId;
        (client as ExtendedClient).role = 'crew';

        // Send the ship ID back to the crew client, for reference.
        client.send('joined', { shipId });
    }

    onLeave(client: Client) {
        const extendedClient = client as ExtendedClient;
        const shipId = extendedClient.shipId;
        const role = extendedClient.role;

        if (!shipId || !role) {
            console.log(client.sessionId, 'left without proper setup');
            return;
        }

        const ship = this.state.ships.get(shipId);

        if (role === 'ship') {
            console.log(client.sessionId, 'ship left!');

            // Mark the ship as unowned, so that its client can reclaim it if they rejoin.
            if (ship) {
                ship.ownerId = '';
            }
        } else {
            console.log(client.sessionId, 'crew member left');
            // Remove a crew member from its ship.
            const ship = this.state.ships.get(shipId);
            if (ship) {
                ship.crew = ship.crew.filter(id => id !== client.sessionId) as ArraySchema<string>;

                if (ship.crew.length === 0 && ship.ownerId === '') {
                    // If the ship has no crew and no owner, remove it.
                    this.state.ships.delete(shipId);
                }
            }
        }
    }

    onDispose() {
        console.log('room', this.roomId, 'disposing...');
    }
}

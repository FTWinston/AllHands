import { StateView } from '@colyseus/schema';
import { Room, Client } from 'colyseus';
import { soloCrewIdentifier } from 'common-data/utils/constants';
import type { CrewRole } from 'common-data/types/CrewRole';
import type { ServerConfig } from 'common-data/types/ServerConfig';
import { customAlphabet } from 'nanoid/non-secure';

import { CrewState } from './CrewState';
import { GameState } from './GameState';
import { ShipState } from './ShipState';

interface JoinOptions {
    type?: 'ship' | 'crew';
    crewId?: string;
}

type ClientData = Required<JoinOptions>;

export class GameRoom extends Room<GameState, unknown, ClientData> {
    private idGenerator = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ', 3);
    private allowMultipleCrews = false;

    getCrewId() {
        if (!this.allowMultipleCrews) {
            return soloCrewIdentifier;
        }

        let id: string;

        do {
            id = this.idGenerator();
        } while (this.state.crews.has(id));

        return id;
    };

    onCreate(config: ServerConfig) {
        this.allowMultipleCrews = config.multiship;

        this.state = new GameState();

        // Temporary message handler for testing.
        this.onMessage('message', (client, message) => {
            console.log(`Message from ${client.sessionId}:`, message);

            this.broadcast('messages', `(${client.sessionId}) ${message}`);
        });

        this.onMessage('ping', (client, message) => {
            // Echo the client's timestamp back, and add the server's timestamp.
            client.send('pong', {
                clientSendTime: message.clientSendTime,
                serverTime: Date.now(),
            });
        });

        this.onMessage('role', (client, role: CrewRole | '') => {
            console.log(`Role message from ${client.sessionId}: ${role}`);

            const crewId = client.userData?.crewId;
            if (!crewId) {
                throw new Error('Client has no crew ID assigned');
            }

            if (this.state.gameStatus === 'active') {
                throw new Error('Cannot change roles while game is active');
            }

            const crew = this.state.crews.get(crewId);

            if (!crew) {
                throw new Error(`Crew ${crewId} not found`);
            }

            // Update crew's state to account for client's role (change).
            if (role === '') {
                crew.unassignRole(client.sessionId);
            } else if (!crew.tryAssignRole(client.sessionId, role)) {
                throw new Error(`Role ${role} is already taken on crew ${crew.crewId}`);
            }
        });

        this.onMessage('ready', (client, ready: boolean) => {
            console.log(`Ready message from ${client.sessionId}: ${ready}`);

            const crewId = client.userData?.crewId;
            if (!crewId) {
                throw new Error('Client has no crew ID assigned');
            }

            if (this.state.gameStatus === 'active') {
                throw new Error('Cannot update ready status while game is active');
            }

            const crew = this.state.crews.get(crewId);

            if (!crew) {
                throw new Error(`Crew ${crewId} not found`);
            }

            crew.crewReady.set(client.sessionId, ready);

            if (ready) {
                this.checkIfEveryoneIsReady();
            }
        });
    }

    onAuth(_client: Client<ClientData>, options: JoinOptions) {
        // Require a type for every join.
        if (options.type === 'ship') {
            return true;
        }
        if (options.type === 'crew' && typeof options.crewId === 'string') {
            return true;
        }

        console.log('rejecting join with invalid options', options);
        return false;
    }

    onJoin(client: Client<ClientData>, options: JoinOptions) {
        if (options.type === 'ship') {
            this.onShipJoin(client, options.crewId);
        } else if (options.type === 'crew' && options.crewId) {
            this.onCrewJoin(client, options.crewId);
        } else {
            throw new Error('Invalid join options');
        }
    }

    private onShipJoin(client: Client<ClientData>, existingCrewId?: string) {
        console.log(`${client.sessionId} ship joined`);

        // Allow reclaiming an existing crew, if present and un-owned.
        const getExistingCrew = (id?: string) => {
            if (!id) {
                return undefined;
            }

            const crew = this.state.crews.get(id);
            if (crew && crew.shipClientId == '') {
                return crew;
            }

            return undefined;
        };

        let crewId: string;
        let crew: CrewState;

        const existingCrew = getExistingCrew(existingCrewId);

        if (existingCrew && existingCrewId) {
            crewId = existingCrewId;
            crew = existingCrew;
            crew.shipClientId = client.sessionId;
        } else {
            crewId = this.getCrewId();
            crew = new CrewState(client.sessionId, crewId);
            this.state.crews.set(crewId, crew);
        }

        // Tag client so leave logic knows what to do.
        client.userData = {
            type: 'ship',
            crewId,
        };

        client.view = new StateView();
        client.view.add(crew);

        // Send the ship ID back to the ship client, for providing a link for crew members to join.
        client.send('joined', { crewId });
    }

    private onCrewJoin(client: Client<ClientData>, crewId: string) {
        console.log(`${client.sessionId} player joined for crew ${crewId}`);

        const crew = this.state.crews.get(crewId);

        if (!crew) {
            throw new Error(`Invalid crew ID: ${crewId}`);
        }

        if (!crew.tryAdd(client.sessionId)) {
            throw new Error(`That crew is full: ${crewId}`);
        }

        client.userData = {
            type: 'crew',
            crewId: crewId,
        };

        client.view = new StateView();
        client.view.add(crew);

        // Send the ship ID back to the crew client, for reference.
        client.send('joined', { crewId });
    }

    onLeave(client: Client<ClientData>) {
        const crewId = client.userData?.crewId;
        const type = client.userData?.type;

        if (!crewId || !type) {
            console.log(client.sessionId, 'left without proper setup');
            return;
        }

        const crew = this.state.crews.get(crewId);

        if (type === 'ship') {
            this.onShipLeave(client, crew);
        } else {
            this.onCrewLeave(client, crew);
        }
    }

    onShipLeave(client: Client<ClientData>, crew: CrewState | undefined) {
        console.log(client.sessionId, 'ship left!');

        // Mark the crew as unowned, so that its client can reclaim it if they rejoin.
        if (crew) {
            crew.shipClientId = '';
        }
    }

    onCrewLeave(client: Client<ClientData>, crew: CrewState | undefined) {
        console.log(client.sessionId, 'crew member left');

        // Remove crew member from their crew.
        if (crew) {
            crew.remove(client.sessionId);

            if (crew.isUnused()) {
                // If the crew has no members and no owner, remove it.
                this.state.crews.delete(crew.crewId);
            }
        }
    }

    onDispose() {
        console.log('room disposing...');
    }

    checkIfEveryoneIsReady() {
        for (const crew of this.state.crews.values()) {
            if (!crew.isReady()) {
                return;
            }
        }

        if (this.state.gameStatus === 'setup') {
            this.populateGameWorld();
        } else {
            this.startOrResume();
        }
    }

    populateGameWorld() {
        console.log('All crew members are ready! Starting game...');
        // Create a ship for each crew.

        // TODO: these should have locations in the world, initial system states, etc.

        // TODO: create enemies, scenario elements, etc.

        let nextShipId = 1;
        for (const crew of this.state.crews.values()) {
            const ship = new ShipState();
            ship.crew = crew;
            this.state.ships.set(`ship${nextShipId++}`, ship);
        }

        this.startOrResume();
    }

    startOrResume() {
        this.state.gameStatus = 'active';

        for (const ship of this.state.ships.values()) {
            ship.crew?.assignToShip(ship, this);
        }
    }

    pause() {
        console.log('Game paused');
        this.state.gameStatus = 'paused';

        for (const ship of this.state.ships.values()) {
            ship.crew?.unassignFromShip(ship, this);
        }
    }
}

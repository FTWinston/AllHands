import { getStateCallbacks, Room } from 'colyseus.js';
import { Button, Screen } from 'common-ui';
import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

import type { ServerType } from '../../hooks/useServerConnection';
import { soloCrewIdentifier, type ServerAddress } from 'common-types';
import type { GameState } from 'engine/classes/GameState';

type Props = {
    serverAddress: ServerAddress;
    serverType: ServerType;
    allowMultipleCrews: boolean;
    room: Room<GameState>;
    crewId: string;
    disconnect: () => void;
};

type SystemState = 'unoccupied' | 'occupied' | 'ready';

export const GameLobby: React.FC<Props> = (props) => {
    const { serverAddress, room, crewId } = props;

    const [helmState, setHelmState] = useState<SystemState>('unoccupied');
    const [tacticalState, setTacticalState] = useState<SystemState>('unoccupied');
    const [sensorsState, setSensorsState] = useState<SystemState>('unoccupied');
    const [engineerState, setEngineerState] = useState<SystemState>('unoccupied');
    const [numUnassigned, setNumUnassigned] = useState(0);

    useEffect(() => {
        if (!room || !crewId) {
            return;
        }

        const crew = room.state.crews.get(crewId);
        if (!crew) {
            console.log(`crew ${crewId} not found in room state`);
            return;
        }

        setHelmState(crew.helmClientId === '' ? 'unoccupied' : crew.crewReady.get(crew.helmClientId) ? 'ready' : 'occupied');
        setTacticalState(crew.tacticalClientId === '' ? 'unoccupied' : crew.crewReady.get(crew.tacticalClientId) ? 'ready' : 'occupied');
        setSensorsState(crew.sensorsClientId === '' ? 'unoccupied' : crew.crewReady.get(crew.sensorsClientId) ? 'ready' : 'occupied');
        setEngineerState(crew.engineerClientId === '' ? 'unoccupied' : crew.crewReady.get(crew.engineerClientId) ? 'ready' : 'occupied');

        const callbacks = getStateCallbacks(room);

        const updateCounts = () => {
            let numUnassigned = crew.crewReady.size;
            if (crew.helmClientId) {
                numUnassigned -= 1;
            }
            if (crew.tacticalClientId) {
                numUnassigned -= 1;
            }
            if (crew.sensorsClientId) {
                numUnassigned -= 1;
            }
            if (crew.engineerClientId) {
                numUnassigned -= 1;
            }
            setNumUnassigned(numUnassigned);
        };

        // Listen for changes to the crew ready state, so that the state of each role can be updated,
        // and the number of unassigned crew is kept up to date.
        const readyStateChanged = (ready: boolean, clientID: string) => {
            updateCounts();

            if (clientID === crew.helmClientId) {
                setHelmState(ready ? 'ready' : 'occupied');
            }
            if (clientID === crew.tacticalClientId) {
                setTacticalState(ready ? 'ready' : 'occupied');
            }
            if (clientID === crew.sensorsClientId) {
                setSensorsState(ready ? 'ready' : 'occupied');
            }
            if (clientID === crew.engineerClientId) {
                setEngineerState(ready ? 'ready' : 'occupied');
            }
        };
        const unbindAddCallback = callbacks(crew).crewReady.onAdd(readyStateChanged);
        const unbindRemoveCallback = callbacks(crew).crewReady.onRemove(readyStateChanged);
        /*const unbindChangeCallback = */callbacks(crew).crewReady.onChange(readyStateChanged);

        // Also listen for changes to the role assignments.
        callbacks(crew).listen('helmClientId', (newClientId) => {
            setHelmState(newClientId === '' ? 'unoccupied' : crew.crewReady.get(newClientId) ? 'ready' : 'occupied');
            updateCounts();
        });
        callbacks(crew).listen('tacticalClientId', (newClientId) => {
            setTacticalState(newClientId === '' ? 'unoccupied' : crew.crewReady.get(newClientId) ? 'ready' : 'occupied');
            updateCounts();
        });
        callbacks(crew).listen('sensorsClientId', (newClientId) => {
            setSensorsState(newClientId === '' ? 'unoccupied' : crew.crewReady.get(newClientId) ? 'ready' : 'occupied');
            updateCounts();
        });
        callbacks(crew).listen('engineerClientId', (newClientId) => {
            setEngineerState(newClientId === '' ? 'unoccupied' : crew.crewReady.get(newClientId) ? 'ready' : 'occupied');
            updateCounts();
        });

        return () => {
            unbindAddCallback();
            unbindRemoveCallback();
            //unbindChangeCallback();
        };
    }, [room, crewId]);

    // TODO: show a message about starting when all roles are ready, across all ships (if allowMultipleCrews is true).

    let serverUrl = `http://${serverAddress.ip}:${serverAddress.port}/`;
    if (crewId !== soloCrewIdentifier) {
        serverUrl += `?crew=${crewId}`;
    }

    return (
        <Screen>
            <h1>Scan to connect</h1>
            <p>
                Open your phone camera and scan the QR code below to join the game.
            </p>
            <p>
                Or open your browser and go to <strong>{serverUrl}</strong>
            </p>
            <QRCode value={serverUrl} size={256} />

            <div>
                <p>Your crew has the following roles:</p>
                <ul>
                    <li>Helm: {helmState}</li>
                    <li>Tactical: {tacticalState}</li>
                    <li>Sensors: {sensorsState}</li>
                    <li>Engineer: {engineerState}</li>
                </ul>
                {numUnassigned > 0 && <p>There {numUnassigned === 1 ? 'is' : 'are'} also {numUnassigned} unassigned crew member{numUnassigned === 1 ? '' : 's'}.</p>}
            </div>

            <Button
                onClick={props.disconnect}
                label="Disconnect"
                size="medium"
                appearance="secondary"
            />
        </Screen>
    );
};

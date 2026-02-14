import { getStateCallbacks, Room } from '@colyseus/sdk';
import { type ServerAddress } from 'common-data/types/ServerAddress';
import { FC, useEffect, useState } from 'react';
import { GameLobbyDisplay, type SystemState } from './components/GameLobbyDisplay';
import type { GameState } from 'engine/state/GameState';

type Props = {
    serverAddress: ServerAddress;
    allowMultipleCrews: boolean;
    room: Room<{ state: GameState }>;
    crewId: string;
    disconnect: () => void;
};

export const GameLobby: FC<Props> = (props) => {
    const { serverAddress, allowMultipleCrews, room, crewId, disconnect } = props;

    const [helmState, setHelmState] = useState<SystemState>('unoccupied');
    const [tacticalState, setTacticalState] = useState<SystemState>('unoccupied');
    const [sensorsState, setSensorsState] = useState<SystemState>('unoccupied');
    const [engineerState, setEngineerState] = useState<SystemState>('unoccupied');
    const [isFull, setIsFull] = useState(false);
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
            setIsFull(crew.crewReady.size >= 4);
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
        /* const unbindChangeCallback = */callbacks(crew).crewReady.onChange(readyStateChanged);

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
            // unbindChangeCallback();
        };
    }, [room, crewId]);

    // TODO: show a message about starting when all roles are ready, across all ships (if allowMultipleCrews is true).

    return (
        <GameLobbyDisplay
            serverAddress={serverAddress}
            crewId={crewId}
            allowMultipleCrews={allowMultipleCrews}
            disconnect={disconnect}
            helmState={helmState}
            tacticalState={tacticalState}
            sensorsState={sensorsState}
            engineerState={engineerState}
            numUnassigned={numUnassigned}
            isFull={isFull}
        />
    );
};

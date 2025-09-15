import { getStateCallbacks, Room } from 'colyseus.js';
import { CrewRole, engineerClientRole, helmClientRole, sensorClientRole, soloCrewIdentifier, tacticalClientRole } from 'common-types';
import { Screen } from 'common-ui/Screen';
import { ToggleButton } from 'common-ui/ToggleButton';
import { useState, useEffect } from 'react';

import type { GameState } from 'engine/classes/GameState';

type Props = {
    room: Room<GameState>;
    crewId: string;
    role: CrewRole | null;
    ready: boolean;
};

export const GameLobby: React.FC<Props> = (props) => {
    const { room, crewId, role, ready } = props;

    const [helmOccupied, setHelmOccupied] = useState(false);
    const [tacticalOccupied, setTacticalOccupied] = useState(false);
    const [sensorsOccupied, setSensorsOccupied] = useState(false);
    const [engineerOccupied, setEngineerOccupied] = useState(false);

    useEffect(() => {
        if (!room || !crewId) {
            return;
        }

        const crew = room.state.crews.get(crewId);
        if (!crew) {
            console.log(`crew ${crewId} not found in room state`);
            return;
        }

        setHelmOccupied(crew.helmClientId !== '');
        setTacticalOccupied(crew.tacticalClientId !== '');
        setSensorsOccupied(crew.sensorsClientId !== '');
        setEngineerOccupied(crew.engineerClientId !== '');

        const callbacks = getStateCallbacks(room);

        const unbindHelmCallback = callbacks(crew).listen('helmClientId', (clientId) => setHelmOccupied(clientId !== ''));
        const unbindTacticalCallback = callbacks(crew).listen('tacticalClientId', (clientId) => setTacticalOccupied(clientId !== ''));
        const unbindSensorsCallback = callbacks(crew).listen('sensorsClientId', (clientId) => setSensorsOccupied(clientId !== ''));
        const unbindEngineerCallback = callbacks(crew).listen('engineerClientId', (clientId) => setEngineerOccupied(clientId !== ''));

        return () => {
            unbindHelmCallback();
            unbindTacticalCallback();
            unbindSensorsCallback();
            unbindEngineerCallback();
        };
    }, [room, crewId]);

    return (
        <Screen>
            <h1>Choose your role</h1>
            {crewId !== soloCrewIdentifier && <p>You are a member of crew {crewId}.</p>}
            <div>
                <button disabled={helmOccupied && role !== helmClientRole} onClick={() => {
                    room.send('role', role === helmClientRole ? '' : helmClientRole);
                }}>
                    Helm {helmOccupied ? '(occupied)' : '(available)'} {role === helmClientRole ? ' - you are this' : ''}
                </button>
                <button disabled={tacticalOccupied && role !== tacticalClientRole} onClick={() => {
                    room.send('role', role === tacticalClientRole ? '' : tacticalClientRole);
                }}>
                    Tactical {tacticalOccupied ? '(occupied)' : '(available)'} {role === tacticalClientRole ? ' - you are this' : ''}
                </button>
                <button disabled={sensorsOccupied && role !== sensorClientRole} onClick={() => {
                    room.send('role', role === sensorClientRole ? '' : sensorClientRole);
                }}>
                    Sensors {sensorsOccupied ? '(occupied)' : '(available)'} {role === sensorClientRole ? ' - you are this' : ''}
                </button>
                <button disabled={engineerOccupied && role !== engineerClientRole} onClick={() => {
                    room.send('role', role === engineerClientRole ? '' : engineerClientRole);
                }}>
                    Engineer {engineerOccupied ? '(occupied)' : '(available)'} {role === engineerClientRole ? ' - you are this' : ''}
                </button>
            </div>
            <p>
                When all crewmates have joined and everyone has selected a role,
                indicate that you are ready, and the game will start.
            </p>

            <ToggleButton
                label="Ready"
                pressed={ready}
                onPressedChanged={(pressed) => {
                    room.send('ready', pressed);
                }}
            />
        </Screen>
    );
};

import { Screen } from 'common-ui';
import { getStateCallbacks, Room } from 'colyseus.js';
import { useState, useEffect } from 'react';
import { CrewRole, engineerClientRole, helmClientRole, sensorClientRole, tacticalClientRole } from 'common-types';
import type { GameState } from 'engine/classes/GameState';

type Props = {
    room: Room<GameState>;
    crewId: string;
    role: CrewRole | null;
    setRole: (role: CrewRole | null) => void;
};

export const GameLobby: React.FC<Props> = (props) => {
    const { room, crewId, role, setRole } = props;

    const [helmOccupied, setHelmOccupied] = useState(false);
    const [tacticalOccupied, setTacticalOccupied] = useState(false);
    const [sensorsOccupied, setSensorsOccupied] = useState(false);
    const [engineerOccupied, setEngineerOccupied] = useState(false);
    const [ready, setReady] = useState(false);
    
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
    }, [room, crewId, setRole]);

    return (
        <Screen>
            <h1>Choose your role</h1>
            <p>You are a member of crew {crewId}.</p>
            <div>
                <button disabled={helmOccupied && role !== helmClientRole} onClick={() => {
                    room.send('role', role === helmClientRole ? '' : helmClientRole);
                    setRole(role === helmClientRole ? null : helmClientRole );
                }}>
                    Helm {helmOccupied ? '(occupied)' : '(available)'} {role === helmClientRole ? ' - you are this' : ''}
                </button>
                <button disabled={tacticalOccupied && role !== tacticalClientRole} onClick={() => {
                    room.send('role', role === tacticalClientRole ? '' : tacticalClientRole);
                    setRole(role === tacticalClientRole ? null : tacticalClientRole );
                }}>
                    Tactical {tacticalOccupied ? '(occupied)' : '(available)'} {role === tacticalClientRole ? ' - you are this' : ''}
                </button>
                <button disabled={sensorsOccupied && role !== sensorClientRole} onClick={() => {
                    room.send('role', role === sensorClientRole ? '' : sensorClientRole);
                    setRole(role === sensorClientRole ? null : sensorClientRole );
                }}>
                    Sensors {sensorsOccupied ? '(occupied)' : '(available)'} {role === sensorClientRole ? ' - you are this' : ''}
                </button>
                <button disabled={engineerOccupied && role !== engineerClientRole} onClick={() => {
                    room.send('role', role === engineerClientRole ? '' : engineerClientRole);
                    setRole(role === engineerClientRole ? null : engineerClientRole );
                }}>
                    Engineer {engineerOccupied ? '(occupied)' : '(available)'} {role === engineerClientRole ? ' - you are this' : ''}
                </button>
            </div>
            <p>
                When all crewmates have joined and everyone has selected a role,
                indicate that you are ready, and the game will start.
            </p>

            <button disabled={!!role} onClick={() => {
                room.send('ready', !ready);
                setReady(!ready);
            }}>
                Ready
            </button>
        </Screen>
    );
};

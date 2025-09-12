import { Screen } from 'common-ui';
import { getStateCallbacks, Room } from 'colyseus.js';
import { useState, useEffect } from 'react';
import { CrewRole, engineerClientRole, helmClientRole, sensorClientRole, tacticalClientRole } from 'common-types';

type Props = {
    room: Room;
    shipId: string;
    role: CrewRole | null;
    setRole: (role: CrewRole | null) => void;
};

export const GameLobby: React.FC<Props> = (props) => {
    const { room, shipId, role, setRole } = props;

    const [helmOccupied, setHelmOccupied] = useState(false);
    const [tacticalOccupied, setTacticalOccupied] = useState(false);
    const [sensorsOccupied, setSensorsOccupied] = useState(false);
    const [engineerOccupied, setEngineerOccupied] = useState(false);
    
    useEffect(() => {
        const ship = room.state.ships.get(shipId);
        if (!ship) {
            return;
        }

        const localUserId = room.sessionId;

        setHelmOccupied(ship.crewByRole.has('helm'));
        setTacticalOccupied(ship.crewByRole.has('tactical'));
        setSensorsOccupied(ship.crewByRole.has('sensors'));
        setEngineerOccupied(ship.crewByRole.has('engineer'));

        const callbacks = getStateCallbacks(room);

        const unbindAddCallback = callbacks(ship).crewByRole.onAdd((userID, role) => {
            if (role === 'helm') {
                setHelmOccupied(true);
                if (userID === localUserId) {
                    setRole(helmClientRole);
                }
            } else if (role === 'tactical') {
                setTacticalOccupied(true);
                if (userID === localUserId) {
                    setRole(tacticalClientRole);
                }
            } else if (role === 'sensors') {
                setSensorsOccupied(true);
                if (userID === localUserId) {
                    setRole(sensorClientRole);
                }
            } else if (role === 'engineer') {
                setEngineerOccupied(true);
                if (userID === localUserId) {
                    setRole(engineerClientRole);
                }
            }
        });
        const unbindRemoveCallback = callbacks(ship).crewByRole.onRemove((userID, role) => {
            if (role === 'helm') {
                setHelmOccupied(false);
            } else if (role === 'tactical') {
                setTacticalOccupied(false);
            } else if (role === 'sensors') {
                setSensorsOccupied(false);
            } else if (role === 'engineer') {
                setEngineerOccupied(false);
            }

            if (userID === localUserId) {
                setRole(null);
            }
        });

        return () => {
            unbindAddCallback();
            unbindRemoveCallback();
        };
    }, [room, shipId, setRole]);

    // TODO: Show a toggleable "ready" button.

    return (
        <Screen>
            <h1>Choose your role</h1>
            <p>You are a crew member of ship {shipId}.</p>
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
            
        </Screen>
    );
};

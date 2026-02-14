import { getStateCallbacks, Room } from '@colyseus/sdk';
import { CrewRole } from 'common-data/features/ships/types/CrewRole';
import { useState, useEffect, FC } from 'react';
import { enterFullscreen, exitFullscreen } from '../../utils/fullscreen';
import { GameLobbyDisplay } from './GameLobbyDisplay';
import type { GameState } from 'engine/state/GameState';

type Props = {
    room: Room<{ state: GameState }>;
    crewId: string;
    role: CrewRole | null;
    ready: boolean;
};

export const GameLobby: FC<Props> = (props) => {
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

        const unbindHelmCallback = callbacks(crew).listen('helmClientId', clientId => setHelmOccupied(clientId !== ''));
        const unbindTacticalCallback = callbacks(crew).listen('tacticalClientId', clientId => setTacticalOccupied(clientId !== ''));
        const unbindSensorsCallback = callbacks(crew).listen('sensorsClientId', clientId => setSensorsOccupied(clientId !== ''));
        const unbindEngineerCallback = callbacks(crew).listen('engineerClientId', clientId => setEngineerOccupied(clientId !== ''));

        return () => {
            unbindHelmCallback();
            unbindTacticalCallback();
            unbindSensorsCallback();
            unbindEngineerCallback();
        };
    }, [room, crewId]);

    return (
        <GameLobbyDisplay
            crewId={crewId}
            role={role}
            ready={ready}
            helmOccupied={helmOccupied}
            tacticalOccupied={tacticalOccupied}
            sensorsOccupied={sensorsOccupied}
            engineerOccupied={engineerOccupied}
            onRoleChange={(newRole) => {
                room.send('role', newRole);
            }}
            onReadyChange={(newReady) => {
                room.send('ready', newReady);
                if (newReady) {
                    enterFullscreen();
                } else {
                    exitFullscreen();
                }
            }}
        />
    );
};

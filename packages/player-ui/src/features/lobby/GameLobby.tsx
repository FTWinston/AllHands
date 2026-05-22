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
    const [scienceOccupied, setScienceOccupied] = useState(false);
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
        setScienceOccupied(crew.scienceClientId !== '');
        setEngineerOccupied(crew.engineerClientId !== '');

        const callbacks = getStateCallbacks(room);

        const unbindHelmCallback = callbacks(crew).listen('helmClientId', clientId => setHelmOccupied(clientId !== ''));
        const unbindTacticalCallback = callbacks(crew).listen('tacticalClientId', clientId => setTacticalOccupied(clientId !== ''));
        const unbindScienceCallback = callbacks(crew).listen('scienceClientId', clientId => setScienceOccupied(clientId !== ''));
        const unbindEngineerCallback = callbacks(crew).listen('engineerClientId', clientId => setEngineerOccupied(clientId !== ''));

        return () => {
            unbindHelmCallback();
            unbindTacticalCallback();
            unbindScienceCallback();
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
            scienceOccupied={scienceOccupied}
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

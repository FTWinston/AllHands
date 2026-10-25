import { useRoomState } from '@colyseus/react';
import { getStateCallbacks, Room } from '@colyseus/sdk';
import { type ServerAddress } from 'common-data/types/ServerAddress';
import { ScreenFade } from 'common-ui/components/ScreenFade';
import { sounds } from 'common-ui/features/sound/sounds';
import { FC, useEffect, useRef, useState } from 'react';
import { GameLobbyDisplay, type SystemState } from './components/GameLobbyDisplay';
import type { GameState } from 'engine/state/GameState';

type Props = {
    serverAddress: ServerAddress;
    allowMultipleCrews: boolean;
    room: Room<unknown, GameState>;
    crewId: string;
    disconnect: () => void;
};

export const GameLobby: FC<Props> = (props) => {
    const { serverAddress, allowMultipleCrews, room, crewId, disconnect } = props;

    const startCountdown = useRoomState(room, state => state.startCountdown) ?? 0;
    useCountdownStartSound(startCountdown);

    const [helmState, setHelmState] = useState<SystemState>('unoccupied');
    const [tacticalState, setTacticalState] = useState<SystemState>('unoccupied');
    const [scienceState, setscienceState] = useState<SystemState>('unoccupied');
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

        const getState = (clientId: string): SystemState => clientId === '' ? 'unoccupied' : 'occupied';

        setHelmState(getState(crew.helmClientId));
        setTacticalState(getState(crew.tacticalClientId));
        setscienceState(getState(crew.scienceClientId));
        setEngineerState(getState(crew.engineerClientId));

        const callbacks = getStateCallbacks(room);

        const updateCounts = () => {
            let numUnassigned = crew.crewClientIds.length;
            if (crew.helmClientId) {
                numUnassigned -= 1;
            }
            if (crew.tacticalClientId) {
                numUnassigned -= 1;
            }
            if (crew.scienceClientId) {
                numUnassigned -= 1;
            }
            if (crew.engineerClientId) {
                numUnassigned -= 1;
            }
            setIsFull(crew.crewClientIds.length >= 4);
            setNumUnassigned(numUnassigned);
        };

        // Keep the number of unassigned crew up to date as crew members join and leave.
        const unbindAddCallback = callbacks(crew).crewClientIds.onAdd(updateCounts);
        const unbindRemoveCallback = callbacks(crew).crewClientIds.onRemove(updateCounts);

        // Also listen for changes to the role assignments.
        const unbindHelmCallback = callbacks(crew).listen('helmClientId', (newClientId) => {
            setHelmState(getState(newClientId));
            updateCounts();
        });
        const unbindTacticalCallback = callbacks(crew).listen('tacticalClientId', (newClientId) => {
            setTacticalState(getState(newClientId));
            updateCounts();
        });
        const unbindScienceCallback = callbacks(crew).listen('scienceClientId', (newClientId) => {
            setscienceState(getState(newClientId));
            updateCounts();
        });
        const unbindEngineerCallback = callbacks(crew).listen('engineerClientId', (newClientId) => {
            setEngineerState(getState(newClientId));
            updateCounts();
        });

        return () => {
            unbindAddCallback();
            unbindRemoveCallback();
            unbindHelmCallback();
            unbindTacticalCallback();
            unbindScienceCallback();
            unbindEngineerCallback();
        };
    }, [room, crewId]);

    // TODO: show a message about starting when all roles are claimed, across all ships (if allowMultipleCrews is true).

    const sceneChange = useRoomState(room, state => state.sceneChange);

    return (
        <>
            <GameLobbyDisplay
                serverAddress={serverAddress}
                crewId={crewId}
                allowMultipleCrews={allowMultipleCrews}
                disconnect={disconnect}
                helmState={helmState}
                tacticalState={tacticalState}
                scienceState={scienceState}
                engineerState={engineerState}
                numUnassigned={numUnassigned}
                isFull={isFull}
                startCountdown={startCountdown}
            />
            <ScreenFade covered={sceneChange === 'start'} />
        </>
    );
};

/** Sound the alert when the countdown to the game starting begins, i.e. once every role is claimed. */
function useCountdownStartSound(startCountdown: number) {
    const previousCountdown = useRef(startCountdown);

    useEffect(() => {
        if (previousCountdown.current === 0 && startCountdown > 0) {
            sounds.countdownStarted();
        }
        previousCountdown.current = startCountdown;
    }, [startCountdown]);
}

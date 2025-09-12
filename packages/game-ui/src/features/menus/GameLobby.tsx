import QRCode from 'react-qr-code';
import type { ServerAddress } from 'common-types';
import { Button, Screen } from 'common-ui';
import { getStateCallbacks, Room } from 'colyseus.js';
import type { ServerType } from '../../hooks/useServerConnection';
import type { GameState } from 'engine/classes/GameState';
import { useEffect, useState } from 'react';

type Props = {
    serverAddress: ServerAddress;
    serverType: ServerType;
    allowMultipleCrews: boolean;
    room: Room<GameState>;
    shipId: string;
    disconnect: () => void;
};

export const GameLobby: React.FC<Props> = (props) => {
    const { serverAddress, room, shipId } = props;

    const [helmOccupied, setHelmOccupied] = useState(false);
    const [tacticalOccupied, setTacticalOccupied] = useState(false);
    const [sensorsOccupied, setSensorsOccupied] = useState(false);
    const [engineerOccupied, setEngineerOccupied] = useState(false);
    
    useEffect(() => {
        const ship = room.state.ships.get(shipId);
        if (!ship) {
            return;
        }

        setHelmOccupied(ship.crewByRole.has('helm'));
        setTacticalOccupied(ship.crewByRole.has('tactical'));
        setSensorsOccupied(ship.crewByRole.has('sensors'));
        setEngineerOccupied(ship.crewByRole.has('engineer'));

        const callbacks = getStateCallbacks(room);

        const unbindAddCallback = callbacks(ship).crewByRole.onAdd((_, role) => {
            if (role === 'helm') {
                setHelmOccupied(true);
            } else if (role === 'tactical') {
                setTacticalOccupied(true);
            } else if (role === 'sensors') {
                setSensorsOccupied(true);
            } else if (role === 'engineer') {
                setEngineerOccupied(true);
            }
        });
        const unbindRemoveCallback = callbacks(ship).crewByRole.onRemove((_, role) => {
            if (role === 'helm') {
                setHelmOccupied(false);
            } else if (role === 'tactical') {
                setTacticalOccupied(false);
            } else if (role === 'sensors') {
                setSensorsOccupied(false);
            } else if (role === 'engineer') {
                setEngineerOccupied(false);
            }
        });

        return () => {
            unbindAddCallback();
            unbindRemoveCallback();
        };
    }, [room, shipId]);
    
    // TODO: show a message about starting when all roles are ready, across all ships (if allowMultipleCrews is true).

    // TODO: show ready status of each role, too.

    const serverUrl = `http://${serverAddress.ip}:${serverAddress.port}/?ship=${shipId}`;

    return (
        <Screen>
            <h1>Scan to connect</h1>
            <p>
                Open your phone camera and scan the QR code below to join the
                game.
            </p>
            <p>
                Or open your browser and go to{' '}
                <a href={serverUrl}>{serverUrl}</a>
            </p>
            <QRCode value={serverUrl} size={256} />

            <div>
                <p>Your ship has the following roles:</p>
                <ul>
                    <li>Helm: {helmOccupied ? 'occupied' : 'empty'}</li>
                    <li>Tactical: {tacticalOccupied ? 'occupied' : 'empty'}</li>
                    <li>Sensors: {sensorsOccupied ? 'occupied' : 'empty'}</li>
                    <li>Engineer: {engineerOccupied ? 'occupied' : 'empty'}</li>
                </ul>
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

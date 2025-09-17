import { soloCrewIdentifier, type ServerAddress } from 'common-types';
import { Button } from 'common-ui/Button';
import { Screen } from 'common-ui/Screen';
import QRCode from 'react-qr-code';

export type SystemState = 'unoccupied' | 'occupied' | 'ready';

export type GameLobbyDisplayProps = {
    serverAddress: ServerAddress;
    crewId: string;
    allowMultipleCrews: boolean;
    disconnect: () => void;
    helmState: SystemState;
    tacticalState: SystemState;
    sensorsState: SystemState;
    engineerState: SystemState;
    numUnassigned: number;
};

export const GameLobbyDisplay: React.FC<GameLobbyDisplayProps> = (props) => {
    const { serverAddress, crewId, allowMultipleCrews, helmState, tacticalState, sensorsState, engineerState, numUnassigned } = props;

    let serverUrl = `http://${serverAddress.ip}:${serverAddress.port}/`;
    if (crewId !== soloCrewIdentifier) {
        serverUrl += `?crew=${crewId}`;
    }

    return (
        <Screen>
            <h1>Scan to connect</h1>
            <p>
                Open your phone camera and scan the QR code below to join {allowMultipleCrews ? 'this crew' : 'the game'}.
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
                {numUnassigned > 0 && (
                    <p>
                        There {numUnassigned === 1 ? 'is' : 'are'} also {numUnassigned} unassigned crew member{numUnassigned === 1 ? '' : 's'}.
                    </p>
                )}
            </div>

            <Button
                onClick={props.disconnect}
                label="Disconnect"
            />
        </Screen>
    );
};

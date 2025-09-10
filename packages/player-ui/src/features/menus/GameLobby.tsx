import { Screen } from 'common-ui';
import { Chat } from './Chat';
import { Room } from 'colyseus.js';

type Props = {
    room: Room;
    shipId: string;
};

export const GameLobby: React.FC<Props> = (props) => {
    const { room, shipId } = props;

    // TODO: show a list of ship's roles, which are occupied, and which yours is

    // Show a toggleable "ready" button.

    return (
        <Screen>
            <h1>Choose your role</h1>
            <p>You are a crew member of ship {shipId}.</p>
            <p>
                When all crewmates have joined and everyone has selected a role,
                indicate that you are ready, and the game will start.
            </p>

            <Chat room={room} />
        </Screen>
    );
};

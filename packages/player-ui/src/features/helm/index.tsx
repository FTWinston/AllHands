import { Room } from 'colyseus.js';
import { Screen } from 'common-ui';

type Props = {
    room: Room;
};

export const Helm = (props: Props) => {
    return (
        <Screen>
            <h1>Helm Console</h1>
            <p>(not implemented yet)</p>
            <p>You are connected to room {props.room.roomId}.</p>
        </Screen>
    );
};

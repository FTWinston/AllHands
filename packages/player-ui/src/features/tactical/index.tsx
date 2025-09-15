import { Room } from 'colyseus.js';
import { Screen } from 'common-ui/Screen';

type Props = {
    room: Room;
};

export const Tactical = (props: Props) => {
    return (
        <Screen>
            <h1>Tactical Console</h1>
            <p>(not implemented yet)</p>
            <p>You are connected to room {props.room.roomId}.</p>
        </Screen>
    );
};

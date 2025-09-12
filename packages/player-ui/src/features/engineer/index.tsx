import { Room } from 'colyseus.js';
import { Screen } from 'common-ui';

type Props = {
    room: Room;
};

export const Engineer = (props: Props) => {
    return (
        <Screen>
            <h1>Engineer Console</h1>
            <p>(not implemented yet)</p>
            <p>You are connected to room {props.room.roomId}.</p>
        </Screen>
    );
};

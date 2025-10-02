import { engineerClientRole, helmClientRole, sensorClientRole, tacticalClientRole } from 'common-types';
import { Engineer } from '../features/engineer/Engineer';
import { Helm } from '../features/helm/Helm';
import { Sensors } from '../features/sensors/Sensors';
import { Tactical } from '../features/tactical/Tactical';
import { GameState } from 'engine/classes/GameState';
import { Room } from 'colyseus.js';

type Props = {
    role: number;
    room: Room<GameState>;
}

export const CrewUI: React.FC<Props> = (props) => {
    const { role, room } = props;

    switch (role) {
        case helmClientRole:
            return <Helm room={room} />;
        case tacticalClientRole:
            return <Tactical room={room} />;
        case sensorClientRole:
            return <Sensors room={room} />;
        case engineerClientRole:
            return <Engineer room={room} />;
        default:
            console.warn('unexpected role', role);
    }
}

import { Room } from 'colyseus.js';
import { CrewRole, engineerClientRole, helmClientRole, sensorClientRole, tacticalClientRole } from 'common-data/features/ships/types/CrewRole';
import { ITimeProvider } from 'common-data/features/space/types/ITimeProvider';
import { FC } from 'react';
import { Engineer } from '../features/engineer/Engineer';
import { Helm } from '../features/helm/Helm';
import { Sensors } from '../features/sensors/Sensors';
import { Tactical } from '../features/tactical/Tactical';
import type { GameState } from 'engine/classes/state/GameState';

type Props = {
    crewId: string;
    role: CrewRole;
    room: Room<GameState>;
    timeProvider: ITimeProvider;
};

export const CrewUI: FC<Props> = (props) => {
    const { role, room, timeProvider } = props;

    switch (role) {
        case helmClientRole:
            return <Helm room={room} timeProvider={timeProvider} />;
        case tacticalClientRole:
            return <Tactical room={room} />;
        case sensorClientRole:
            return <Sensors room={room} />;
        case engineerClientRole:
            return <Engineer room={room} />;
        default:
            console.warn('unexpected role', role);
    }
};

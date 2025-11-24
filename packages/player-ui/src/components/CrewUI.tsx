import { Room } from 'colyseus.js';
import { engineerClientRole, helmClientRole, sensorClientRole, tacticalClientRole } from 'common-types';
import { ITimeSynchronizer } from 'common-ui/types/ITimeSynchronizer';
import { GameState } from 'engine/classes/GameState';
import { FC } from 'react';
import { Engineer } from '../features/engineer/Engineer';
import { Helm } from '../features/helm/Helm';
import { Sensors } from '../features/sensors/Sensors';
import { Tactical } from '../features/tactical/Tactical';

type Props = {
    role: number;
    room: Room<GameState>;
    timeSynchronizer: ITimeSynchronizer;
};

export const CrewUI: FC<Props> = (props) => {
    const { role, room, timeSynchronizer } = props;

    switch (role) {
        case helmClientRole:
            return <Helm room={room} timeSynchronizer={timeSynchronizer} />;
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

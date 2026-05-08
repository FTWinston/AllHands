import { Room } from '@colyseus/sdk';
import { CrewRole, ownEngineerClientRole, ownHelmClientRole, ownSensorClientRole, ownTacticalClientRole } from 'common-data/features/ships/types/CrewRole';
import { ITimeProvider } from 'common-data/features/space/types/ITimeProvider';
import { FC } from 'react';
import { Engineer } from '../features/engineer/Engineer';
import { Helm } from '../features/helm/Helm';
import { Sensors } from '../features/sensors/Sensors';
import { Tactical } from '../features/tactical/Tactical';
import type { GameState } from 'engine/state/GameState';

type Props = {
    shipId: string;
    role: CrewRole;
    room: Room<{ state: GameState }>;
    timeProvider: ITimeProvider;
};

export const CrewUI: FC<Props> = (props) => {
    const { role, room, timeProvider } = props;

    switch (role) {
        case ownHelmClientRole:
            return (
                <Helm
                    room={room}
                    shipId={props.shipId}
                    timeProvider={timeProvider}
                />
            );
        case ownTacticalClientRole:
            return (
                <Tactical
                    room={room}
                    shipId={props.shipId}
                />
            );
        case ownSensorClientRole:
            return (
                <Sensors
                    room={room}
                    shipId={props.shipId}
                />
            );
        case ownEngineerClientRole:
            return (
                <Engineer
                    room={room}
                    shipId={props.shipId}
                />
            );
        default:
            console.warn('unexpected role', role);
    }
};

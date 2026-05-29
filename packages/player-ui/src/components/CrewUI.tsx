import { Room } from '@colyseus/sdk';
import { CrewRole, ownEngineerClientRole, ownHelmClientRole, ownScienceClientRole, ownTacticalClientRole } from 'common-data/features/ships/types/CrewRole';
import { FC } from 'react';
import { Engineer } from '../features/engineer/Engineer';
import { Helm } from '../features/helm/Helm';
import { Science } from '../features/science/Science';
import { Tactical } from '../features/tactical/Tactical';
import type { GameState } from 'engine/state/GameState';

type Props = {
    shipId: string;
    role: CrewRole;
    room: Room<{ state: GameState }>;
};

export const CrewUI: FC<Props> = (props) => {
    const { role, room } = props;

    switch (role) {
        case ownHelmClientRole:
            return (
                <Helm
                    room={room}
                    shipId={props.shipId}
                />
            );
        case ownTacticalClientRole:
            return (
                <Tactical
                    room={room}
                    shipId={props.shipId}
                />
            );
        case ownScienceClientRole:
            return (
                <Science
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

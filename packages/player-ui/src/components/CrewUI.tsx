import { Room } from '@colyseus/sdk';
import { CrewRole, CrewRoleName, ownEngineerClientRole, ownHelmClientRole, ownScienceClientRole, ownTacticalClientRole } from 'common-data/features/ships/types/CrewRole';
import { FC } from 'react';
import { Engineer } from '../features/engineer/Engineer';
import { Helm } from '../features/helm/Helm';
import { Science } from '../features/science/Science';
import { useCrewSoundEffects } from '../features/sound/useCrewSoundEffects';
import { Tactical } from '../features/tactical/Tactical';
import type { GameState } from 'engine/state/GameState';

type Props = {
    shipId: string;
    role: CrewRole;
    room: Room<unknown, GameState>;
};

type StationProps = {
    room: Room<unknown, GameState>;
    shipId: string;
};

const stations: Record<CrewRole, { system: CrewRoleName; Station: FC<StationProps> }> = {
    [ownHelmClientRole]: { system: 'helm', Station: Helm },
    [ownTacticalClientRole]: { system: 'tactical', Station: Tactical },
    [ownScienceClientRole]: { system: 'science', Station: Science },
    [ownEngineerClientRole]: { system: 'engineer', Station: Engineer },
};

export const CrewUI: FC<Props> = (props) => {
    const { system, Station } = stations[props.role];

    useCrewSoundEffects(props.room, props.shipId, system);

    return <Station room={props.room} shipId={props.shipId} />;
};

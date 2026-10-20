import { Snapshot, useRoomState } from '@colyseus/react';
import { Room } from '@colyseus/sdk';
import { CrewRole, CrewRoleName, ownEngineerClientRole, ownHelmClientRole, ownScienceClientRole, ownTacticalClientRole } from 'common-data/features/ships/types/CrewRole';
import { GameObjectInfo, ShipInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ScreenFade } from 'common-ui/components/ScreenFade';
import { FC } from 'react';
import { SystemDamageOverlay } from '../features/damage/SystemDamageOverlay';
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

    const objects = useRoomState(props.room, state => state.objects) as Record<string, Snapshot<GameObjectInfo>>;
    const systemState = (objects?.[props.shipId] as unknown as Snapshot<ShipInfo> | undefined)?.[`${system}State`];
    const damage = systemState?.maxHealth ? 1 - systemState.health / systemState.maxHealth : 0;

    const sceneChange = useRoomState(props.room, state => state.sceneChange);

    return (
        <>
            <Station room={props.room} shipId={props.shipId} />
            <SystemDamageOverlay damage={damage} />
            {/* The header is the same either side of travelling, so it stays visible. */}
            <ScreenFade covered={!!sceneChange} fadeInOnMount keepAbove="[data-crew-header]" />
        </>
    );
};

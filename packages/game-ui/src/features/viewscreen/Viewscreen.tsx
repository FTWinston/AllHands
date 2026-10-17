import { useRoomState } from '@colyseus/react';
import { FactionRelationshipMap, GameObjectInfo, RelationshipViewer } from 'common-data/features/space/types/GameObjectInfo';
import { Keyframes } from 'common-data/features/space/types/Keyframes';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { useWeaponEffects } from 'common-ui/hooks/useWeaponEffects';
import { FC, PropsWithChildren } from 'react';
import { ViewscreenDisplay } from './components/ViewscreenDisplay';
import { ViewscreenPhaseDisplay } from './components/ViewscreenPhaseDisplay';
import type { Room } from '@colyseus/sdk';
import type { GameOutcome, GamePhase } from 'common-data/features/sectors/types/GamePhase';
import type { SectorMessageInfo } from 'common-data/features/sectors/types/SectorMessageInfo';
import type { GameState } from 'engine/state/GameState';

type Props = PropsWithChildren<{
    room: Room<unknown, GameState>;
    shipId: string;
    showMenu: () => void;
}>;

const defaultCenter: Keyframes<Vector2D> = [{ time: 0, x: 0, y: 0 }];

export const Viewscreen: FC<Props> = (props) => {
    const objects = useRoomState(props.room, state => state.objects) as Record<string, GameObjectInfo>;
    const factions = useRoomState(props.room, state => state.factions) as Record<string, { relations: FactionRelationshipMap }>;
    const localShip = objects[props.shipId];
    const weaponEffectsRef = useWeaponEffects(props.room);

    const phase = (useRoomState(props.room, state => state.phase) ?? null) as GamePhase | null;
    const isEnded = useRoomState(props.room, state => state.gameStatus) === 'ended';
    const outcome = (useRoomState(props.room, state => state.outcome) ?? null) as GameOutcome | null;
    const message = (useRoomState(props.room, state => state.message) ?? null) as unknown as SectorMessageInfo | null;

    if (isEnded || phase !== 'encounter') {
        return (
            <ViewscreenPhaseDisplay
                phase={phase}
                isEnded={isEnded}
                outcome={outcome}
                message={message}
                showMenu={props.showMenu}
            >
                {props.children}
            </ViewscreenPhaseDisplay>
        );
    }

    const viewerFaction = localShip?.faction ?? null;
    const viewer: RelationshipViewer = {
        shipId: props.shipId,
        faction: viewerFaction,
        relations: viewerFaction ? factions?.[viewerFaction]?.relations ?? null : null,
    };

    return (
        <ViewscreenDisplay
            center={localShip ? localShip.motion : defaultCenter}
            objects={objects}
            viewer={viewer}
            weaponEffectsRef={weaponEffectsRef}
            showMenu={props.showMenu}
        >
            {props.children}
        </ViewscreenDisplay>
    );
};

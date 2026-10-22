import { useRoomState } from '@colyseus/react';
import { FactionRelationshipMap, GameObjectInfo, RelationshipViewer, ShipInfo } from 'common-data/features/space/types/GameObjectInfo';
import { Keyframes } from 'common-data/features/space/types/Keyframes';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { ScreenFade } from 'common-ui/components/ScreenFade';
import { sounds } from 'common-ui/features/sound/sounds';
import { useBridgeChatter } from 'common-ui/features/sound/useBridgeChatter';
import { useWakeLock } from 'common-ui/hooks/useWakeLock';
import { useWeaponEffects } from 'common-ui/hooks/useWeaponEffects';
import { FC, PropsWithChildren, useEffect, useRef } from 'react';
import { LowHullWarning } from './components/LowHullWarning';
import { ViewscreenDisplay } from './components/ViewscreenDisplay';
import { ViewscreenPhaseDisplay } from './components/ViewscreenPhaseDisplay';
import { useViewscreenEffects } from './hooks/useViewscreenEffects';
import type { Room } from '@colyseus/sdk';
import type { GameOutcome, GamePhase } from 'common-data/features/sectors/types/GamePhase';
import type { SectorMapInfo } from 'common-data/features/sectors/types/SectorMapInfo';
import type { SectorMessageInfo } from 'common-data/features/sectors/types/SectorMessageInfo';
import type { GameState } from 'engine/state/GameState';

type Props = PropsWithChildren<{
    room: Room<unknown, GameState>;
    shipId: string;
    showMenu: () => void;
}>;

const defaultCenter: Keyframes<Vector2D> = [{ time: 0, x: 0, y: 0 }];

/** The main screen, fading out and back in around scene changes. */
export const Viewscreen: FC<Props> = (props) => {
    const sceneChange = useRoomState(props.room, state => state.sceneChange);

    useEffect(() => {
        if (sceneChange === 'travel') {
            sounds.warp();
        }
    }, [sceneChange]);

    return (
        <>
            <ViewscreenScene {...props} />
            <ScreenFade covered={!!sceneChange} fadeInOnMount />
        </>
    );
};

/** Whatever the current phase of the game calls for: the space view during an encounter, otherwise the sector map, messages, etc. */
const ViewscreenScene: FC<Props> = (props) => {
    const objects = useRoomState(props.room, state => state.objects) as Record<string, GameObjectInfo>;
    const factions = useRoomState(props.room, state => state.factions) as Record<string, { relations: FactionRelationshipMap }>;
    const localShip = objects[props.shipId];
    const weaponEffectsRef = useWeaponEffects(props.room);

    const phase = (useRoomState(props.room, state => state.phase) ?? null) as GamePhase | null;
    const isEnded = useRoomState(props.room, state => state.gameStatus) === 'ended';
    const outcome = (useRoomState(props.room, state => state.outcome) ?? null) as GameOutcome | null;
    // Snapshots are plain objects, so the shared info interfaces describe them.
    const map = (useRoomState(props.room, state => state.map) ?? null) as unknown as SectorMapInfo | null;
    const message = (useRoomState(props.room, state => state.message) ?? null) as unknown as SectorMessageInfo | null;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    useViewscreenEffects(props.room, props.shipId, phase, isEnded ? outcome : null, canvasRef);
    useBridgeChatter(!isEnded && phase !== null);
    useWakeLock();

    const hull = (localShip as ShipInfo | undefined)?.hullState;

    if (isEnded || phase !== 'encounter') {
        return (
            <ViewscreenPhaseDisplay
                phase={phase}
                isEnded={isEnded}
                outcome={outcome}
                map={map}
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
            canvasRef={canvasRef}
            showMenu={props.showMenu}
        >
            {props.children}
            {hull && <LowHullWarning health={hull.health} maxHealth={hull.maxHealth} />}
        </ViewscreenDisplay>
    );
};

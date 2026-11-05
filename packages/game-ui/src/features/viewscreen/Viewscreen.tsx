import { useRoomState } from '@colyseus/react';
import { isStationKind } from 'common-data/features/sectors/utils/isStationKind';
import { FactionRelationshipMap, GameObjectInfo, PlayerShipInfo, RelationshipViewer, ShipInfo } from 'common-data/features/space/types/GameObjectInfo';
import { Screen } from 'common-ui/components/Screen';
import { ScreenFade } from 'common-ui/components/ScreenFade';
import { sounds } from 'common-ui/features/sound/sounds';
import { useBridgeChatter } from 'common-ui/features/sound/useBridgeChatter';
import { useWakeLock } from 'common-ui/hooks/useWakeLock';
import { useWeaponEffects } from 'common-ui/hooks/useWeaponEffects';
import { FC, PropsWithChildren, useEffect, useRef } from 'react';
import { addKnownCardTypes } from '../cardCompendium/utils/knownCardStorage';
import { LowHullWarning } from './components/LowHullWarning';
import { StationDisplay } from './components/StationDisplay';
import { ViewscreenDisplay } from './components/ViewscreenDisplay';
import { ViewscreenPhaseDisplay } from './components/ViewscreenPhaseDisplay';
import { useShowOutcome } from './hooks/useShowOutcome';
import { useViewscreenEffects } from './hooks/useViewscreenEffects';
import type { Room } from '@colyseus/sdk';
import type { GameOutcome, GamePhase } from 'common-data/features/sectors/types/GamePhase';
import type { SectorMapInfo } from 'common-data/features/sectors/types/SectorMapInfo';
import type { SectorMessageInfo } from 'common-data/features/sectors/types/SectorMessageInfo';
import type { SectorNodeKind } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { GameState } from 'engine/state/GameState';

type Props = PropsWithChildren<{
    room: Room<unknown, GameState>;
    shipId: string;
    showMenu: () => void;
}>;

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

/** Whatever the current phase of the game calls for: the space view during a fight, the station while docked, otherwise the sector map, messages, etc. */
const ViewscreenScene: FC<Props> = (props) => {
    const objects = useRoomState(props.room, state => state.objects) as Record<string, GameObjectInfo>;
    const factions = useRoomState(props.room, state => state.factions) as Record<string, { relations: FactionRelationshipMap }>;
    const localShip = objects[props.shipId];
    const weaponEffectsRef = useWeaponEffects(props.room);

    // Friend and foe stay the same while watching the ship explode, once it's gone.
    const viewerFaction = useRef(localShip?.faction ?? null);
    viewerFaction.current = localShip?.faction ?? viewerFaction.current;

    const phase = (useRoomState(props.room, state => state.phase) ?? null) as GamePhase | null;
    const isEnded = useRoomState(props.room, state => state.gameStatus) === 'ended';
    const outcome = (useRoomState(props.room, state => state.outcome) ?? null) as GameOutcome | null;
    // Snapshots are plain objects, so the shared info interfaces describe them.
    const map = (useRoomState(props.room, state => state.map) ?? null) as unknown as SectorMapInfo | null;
    const message = (useRoomState(props.room, state => state.message) ?? null) as unknown as SectorMessageInfo | null;

    useViewscreenEffects(props.room, props.shipId, phase, isEnded ? outcome : null);
    useBridgeChatter(!isEnded && phase !== null);
    useWakeLock();
    const showOutcome = useShowOutcome(isEnded, outcome);

    const encounterKind = (useRoomState(props.room, state => state.encounterKind) ?? null) as SectorNodeKind | null;
    const encounterName = useRoomState(props.room, state => state.encounter?.name);

    const hull = (localShip as ShipInfo | undefined)?.hullState;
    const antimatter = (localShip as PlayerShipInfo | undefined)?.antimatter;

    // Whatever the crew sees this game becomes known on this device, for the card compendium.
    const seenCardTypes = (localShip as PlayerShipInfo | undefined)?.seenCardTypes;
    useEffect(() => {
        if (seenCardTypes) {
            addKnownCardTypes(seenCardTypes);
        }
    }, [seenCardTypes]);

    if (showOutcome || phase !== 'encounter') {
        return (
            <ViewscreenPhaseDisplay
                phase={phase}
                isEnded={isEnded}
                outcome={outcome}
                map={map}
                message={message}
                antimatter={antimatter}
                showMenu={props.showMenu}
            >
                {props.children}
            </ViewscreenPhaseDisplay>
        );
    }

    if (isStationKind(encounterKind)) {
        return (
            <Screen>
                <StationDisplay
                    kind={encounterKind}
                    name={encounterName ?? ''}
                    antimatter={antimatter}
                    showMenu={props.showMenu}
                >
                    {props.children}
                </StationDisplay>
            </Screen>
        );
    }

    const faction = viewerFaction.current;
    const viewer: RelationshipViewer = {
        shipId: props.shipId,
        faction,
        relations: faction ? factions?.[faction]?.relations ?? null : null,
    };

    return (
        <ViewscreenDisplay
            center={localShip ? localShip.motion : null}
            objects={objects}
            viewer={viewer}
            weaponEffectsRef={weaponEffectsRef}
            showMenu={props.showMenu}
        >
            {props.children}
            {hull && <LowHullWarning health={hull.health} maxHealth={hull.maxHealth} />}
        </ViewscreenDisplay>
    );
};

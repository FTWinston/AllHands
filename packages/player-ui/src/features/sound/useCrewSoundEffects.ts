import { Snapshot, useRoomState } from '@colyseus/react';
import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { SystemHealthChange } from 'common-data/features/ships/types/SystemHealthChange';
import { CrewSystemInfo, GameObjectInfo, ShipInfo } from 'common-data/features/space/types/GameObjectInfo';
import { sounds } from 'common-ui/features/sound/sounds';
import { HumIntensity, useHum } from 'common-ui/features/sound/useHum';
import { vibrate, vibrations } from 'common-ui/features/sound/vibrate';
import { useEffect, useRef } from 'react';
import type { Room } from '@colyseus/sdk';
import type { GameState } from 'engine/state/GameState';

/**
 * Play the sounds and vibrations for a crew station: drawing cards, system damage and repair, and the hum of a highly powered system.
 * (Playing a card makes its sound as it's dropped, in DragCardProvider.)
 */
export function useCrewSoundEffects(room: Room<unknown, GameState>, shipId: string, ownSystem: CrewRoleName) {
    const objects = useRoomState(room, state => state.objects) as Record<string, Snapshot<GameObjectInfo>>;
    const localShip = objects?.[shipId] as unknown as Snapshot<ShipInfo> | undefined;
    const systemState = localShip?.[`${ownSystem}State`] as Snapshot<CrewSystemInfo> | undefined;

    const phase = useRoomState(room, state => state.phase);
    const gameStatus = useRoomState(room, state => state.gameStatus);
    const inEncounter = phase === 'encounter' && gameStatus === 'active';

    useDrawSound(systemState?.hand);

    const powerLevel = systemState?.powerLevel ?? 0;
    useHum(inEncounter ? getHumIntensity(powerLevel) : 0);

    useEffect(() => room.onMessage<SystemHealthChange>('systemHealth', ({ system, change }) => {
        if (system === ownSystem) {
            if (change < 0) {
                sounds.systemDamaged();
                vibrate(vibrations.ownSystemDamaged);
            } else {
                sounds.systemRepaired();
            }
        } else if (system === 'hull' && change < 0) {
            vibrate(vibrations.shipHit);
        }
    }), [room, ownSystem]);
}

function getHumIntensity(powerLevel: number): HumIntensity {
    if (powerLevel >= 5) {
        return 2;
    }
    if (powerLevel === 4) {
        return 1;
    }
    return 0;
}

/** Beep once whenever any card arrives in the hand, but not for the cards already there when first shown. */
function useDrawSound(hand: Snapshot<CrewSystemInfo['hand']> | undefined) {
    const knownCardIds = useRef<Set<number> | null>(null);

    useEffect(() => {
        if (!hand) {
            return;
        }

        const cardIds = new Set(hand.map(card => card.id));
        const previousIds = knownCardIds.current;
        knownCardIds.current = cardIds;

        if (previousIds && [...cardIds].some(id => !previousIds.has(id))) {
            sounds.cardDrawn();
        }
    }, [hand]);
}

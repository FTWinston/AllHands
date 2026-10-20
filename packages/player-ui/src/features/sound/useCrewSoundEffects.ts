import { Snapshot, useRoomState } from '@colyseus/react';
import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { ShipHit } from 'common-data/features/ships/types/ShipHit';
import { CrewSystemInfo, GameObjectInfo, HelmSystemInfo, ScienceSystemInfo, ShipInfo, TacticalSystemInfo } from 'common-data/features/space/types/GameObjectInfo';
import { sounds } from 'common-ui/features/sound/sounds';
import { HumIntensity, useHum } from 'common-ui/features/sound/useHum';
import { vibrate, vibrations } from 'common-ui/features/sound/vibrate';
import { useEffect, useRef } from 'react';
import type { Room } from '@colyseus/sdk';
import type { GameState } from 'engine/state/GameState';

/**
 * Play the sounds and vibrations for a crew station: drawing cards, system damage and repair, power changes, the hum of a highly powered system,
 * and things particular to each station.
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
    useChangeSound(powerLevel, inEncounter, sounds.powerUp, sounds.powerDown);

    // Only one of these will apply, but hooks can't be called conditionally.
    useChangeSound(ownSystem === 'science' ? countScans(systemState as Snapshot<ScienceSystemInfo>) : 0, inEncounter, sounds.scanComplete);
    useChangeSound(ownSystem === 'tactical' ? countReadyWeapons(systemState as Snapshot<TacticalSystemInfo>) : 0, inEncounter, sounds.weaponReady);
    useChangeSound(ownSystem === 'helm' ? (systemState as Snapshot<HelmSystemInfo> | undefined)?.activeManeuver?.startTime ?? 0 : 0, inEncounter, sounds.maneuver);

    useHealthSounds(systemState?.health);

    // Every hit shakes the whole ship. (The hit message arrives before the state patch with any damage to this system,
    // so that system's stronger vibration replaces this one.)
    useEffect(() => room.onMessage<ShipHit>('shipHit', ({ damage }) => {
        if (damage > 0) {
            vibrate(vibrations.shipHit);
        }
    }), [room]);
}

/** Crunch and vibrate when this station's system is damaged, and chime when it's repaired. */
function useHealthSounds(health: number | undefined) {
    const previousHealth = useRef(health);

    useEffect(() => {
        const previous = previousHealth.current;
        previousHealth.current = health;

        if (previous === undefined || health === undefined) {
            return;
        }

        if (health < previous) {
            sounds.systemDamaged();
            vibrate(vibrations.ownSystemDamaged);
        } else if (health > previous) {
            sounds.systemRepaired();
        }
    }, [health]);
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

/** How many of the scanned ship's systems are being watched, plus whether a vulnerability has been identified. */
function countScans(science: Snapshot<ScienceSystemInfo> | undefined) {
    if (!science) {
        return 0;
    }

    return [science.scannedHelm, science.scannedTactical, science.scannedScience, science.scannedEngineer, science.identifiedVulnerability]
        .filter(scan => scan)
        .length;
}

function countReadyWeapons(tactical: Snapshot<TacticalSystemInfo> | undefined) {
    return tactical?.slots.filter(slot => slot.hasBeenFullyCharged).length ?? 0;
}

/** Play a sound whenever a value goes up (or down), while enabled. */
function useChangeSound(value: number, enabled: boolean, onIncrease: () => void, onDecrease?: () => void) {
    const previousValue = useRef(value);

    useEffect(() => {
        const previous = previousValue.current;
        previousValue.current = value;

        if (!enabled) {
            return;
        }

        if (value > previous) {
            onIncrease();
        } else if (value < previous) {
            onDecrease?.();
        }
    }, [value, enabled, onIncrease, onDecrease]);
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

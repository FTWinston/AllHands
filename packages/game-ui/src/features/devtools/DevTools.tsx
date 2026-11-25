import { Room } from '@colyseus/sdk';
import { EncounterId } from 'common-data/features/sectors/types/SectorNodeInfo';
import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { Button } from 'common-ui/components/Button';
import { GameState } from 'engine/state/GameState';
import { FC, useCallback, useEffect, useState } from 'react';
import { CardRangeBar } from './components/CardRangeBar';
import { DevToolsDisplay } from './components/DevToolsDisplay';
import { useCardRange } from './hooks/useCardRange';
import type { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import type { DevEncounterInfo } from 'common-data/features/sectors/types/DevEncounterInfo';

type Props = {
    room: Room<unknown, GameState>;
    encounters: readonly DevEncounterInfo[];
    inLobby?: boolean;
    /** Dev tools keep the game on screen while paused, so say so. */
    paused?: boolean;
};

export const DevTools: FC<Props> = ({ room, encounters, inLobby, paused }) => {
    const addCard = useCallback((system: CrewRoleName, cardId: string) => {
        room?.send('addCard', { system, cardId });
    }, [room]);

    const addEffect = useCallback((system: ShipSystem, effect: SystemEffectType) => {
        room?.send('addEffect', { system, effect });
    }, [room]);

    const adjustHealth = useCallback((system: ShipSystem, relative: boolean, amount: number) => {
        room?.send('adjustHealth', { system, relative, amount });
    }, [room]);

    const adjustTimeScale = useCallback((timeScale: number) => {
        room?.send('adjustTimeScale', { timeScale });
    }, [room]);

    const [serverAutoWin, setServerAutoWin] = useState(false);

    const setAutoWin = useCallback((enabled: boolean) => {
        room?.send('devAutoWin', { enabled });
        setServerAutoWin(enabled);
    }, [room]);

    const loadEncounter = useCallback((encounterId: EncounterId, elite: boolean) => {
        room?.send('devLoadEncounter', { encounterId, elite });
    }, [room]);

    const [cardRange, sendCardRange] = useCardRange(room);

    const goToCard = useCallback((cardType: CardType) => {
        sendCardRange({ action: 'go', cardType });
    }, [sendCardRange]);

    const [showTools, setShowTools] = useState(false);
    const [serverTimeScale, setServerTimeScale] = useState(1);

    useEffect(() => {
        const unsubscribe = room.onMessage<{ timeScale: number; devAutoWin: boolean }>('pong', (message) => {
            setServerTimeScale(message.timeScale);
            setServerAutoWin(message.devAutoWin);
        });
        // The time scale hotkeys change it too, so hear about that at once, rather than at the next pong.
        const unsubscribeTimeScale = room.onMessage<{ timeScale: number }>('timeScale', (message) => {
            setServerTimeScale(message.timeScale);
        });
        return () => {
            unsubscribe();
            unsubscribeTimeScale();
        };
    }, [room]);

    return (
        <>
            <Button
                title="Dev"
                onClick={() => setShowTools(true)}
                style={{
                    position: 'absolute',
                    top: '0.5em',
                    right: '0.5em',
                    zIndex: 1,
                }}
            >
                Dev
            </Button>

            {paused && (
                <div
                    style={{
                        position: 'absolute',
                        top: '0.5em',
                        right: '40vw',
                        zIndex: 1,
                        padding: '0.4em 0.8em',
                        background: 'rgba(0, 0, 0, 0.7)',
                        pointerEvents: 'none',
                    }}
                >
                    Paused (Space to resume)
                </div>
            )}

            {cardRange?.active && !inLobby && (
                <CardRangeBar info={cardRange} send={sendCardRange} />
            )}

            {showTools && (
                <DevToolsDisplay
                    isOpen={showTools}
                    setOpen={setShowTools}
                    addCard={addCard}
                    addEffect={addEffect}
                    adjustHealth={adjustHealth}
                    adjustTimeScale={adjustTimeScale}
                    serverTimeScale={serverTimeScale}
                    autoWin={serverAutoWin}
                    setAutoWin={setAutoWin}
                    encounters={encounters}
                    loadEncounter={loadEncounter}
                    cardRange={cardRange}
                    goToCard={goToCard}
                    inLobby={inLobby}
                />
            )}
        </>
    );
};

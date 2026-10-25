import { Room } from '@colyseus/sdk';
import { EncounterId } from 'common-data/features/sectors/types/SectorNodeInfo';
import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { Button } from 'common-ui/components/Button';
import { GameState } from 'engine/state/GameState';
import { FC, useCallback, useEffect, useState } from 'react';
import { DevToolsDisplay } from './components/DevToolsDisplay';
import type { DevEncounterInfo } from 'common-data/features/sectors/types/DevEncounterInfo';

type Props = {
    room: Room<unknown, GameState>;
    encounters: readonly DevEncounterInfo[];
    inLobby?: boolean;
};

export const DevTools: FC<Props> = ({ room, encounters, inLobby }) => {
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

    const loadEncounter = useCallback((encounterId: EncounterId) => {
        room?.send('devLoadEncounter', { encounterId });
    }, [room]);

    const [showTools, setShowTools] = useState(false);
    const [serverTimeScale, setServerTimeScale] = useState(1);

    useEffect(() => {
        const unsubscribe = room.onMessage<{ timeScale: number; devAutoWin: boolean }>('pong', (message) => {
            setServerTimeScale(message.timeScale);
            setServerAutoWin(message.devAutoWin);
        });
        return unsubscribe;
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
                    inLobby={inLobby}
                />
            )}
        </>
    );
};

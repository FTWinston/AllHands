import { Room } from '@colyseus/sdk';
import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { Button } from 'common-ui/components/Button';
import { GameState } from 'engine/state/GameState';
import { FC, useCallback, useState } from 'react';
import { DevToolsDisplay } from './components/DevToolsDisplay';

type Props = {
    room: Room<{ state: GameState }>;
};

export const DevTools: FC<Props> = ({ room }) => {
    const addCard = useCallback((system: CrewRoleName, cardId: string) => {
        room?.send('addCard', { system, cardId });
    }, [room]);

    const addEffect = useCallback((system: ShipSystem, effect: SystemEffectType) => {
        room?.send('addEffect', { system, effect });
    }, [room]);

    const adjustHealth = useCallback((system: ShipSystem, relative: boolean, amount: number) => {
        room?.send('adjustHealth', { system, relative, amount });
    }, [room]);

    const [showTools, setShowTools] = useState(false);

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
                />
            )}
        </>
    );
};

import { useGameObjects } from 'common-ui/hooks/useGameObjects';
import { useState } from 'react';
import { SlotPropsNoTarget, TacticalDisplay } from './components/TacticalDisplay';
import { ListTargetInfo } from './components/TargetList';
import type { Room } from 'colyseus.js';
import type { GameState } from 'engine/classes/state/GameState';

type Props = {
    room: Room<GameState>;
    shipId: string;
};

export const Tactical = (props: Props) => {
    const [_objects, localShip] = useGameObjects(props.room, props.shipId);
    const [slots] = useState<SlotPropsNoTarget[]>([]);
    const [targets] = useState<ListTargetInfo[]>([]); ;
    const [priority, setPriority] = useState<'hand' | 'power'>('hand');

    if (!localShip?.tacticalState) {
        return <div>unable to load</div>;
    }

    const tacticalState = localShip.tacticalState;

    return (
        <TacticalDisplay
            cards={tacticalState.hand}
            slots={slots}
            targets={targets}
            onPause={() => console.log('pause please')}
            slotDeactivated={() => {}}
            slotFired={() => {}}
            power={tacticalState.energy}
            maxPower={tacticalState.powerLevel}
            handSize={tacticalState.hand.length}
            maxHandSize={tacticalState.health}
            playCard={() => {}}
            priority={priority}
            setPriority={setPriority}
        />
    );
};

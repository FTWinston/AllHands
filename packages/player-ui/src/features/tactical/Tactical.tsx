import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { useState } from 'react';
import { SlotPropsNoTarget, TacticalDisplay } from './components/TacticalDisplay';
import { ListTargetInfo } from './components/TargetList';
import type { Room } from 'colyseus.js';
import type { GameState } from 'engine/classes/state/GameState';

type Props = {
    room: Room<GameState>;
};

export const Tactical = (_props: Props) => {
    const [cards] = useState<CardInstance[]>([]);
    const [slots] = useState<SlotPropsNoTarget[]>([]);
    const [targets] = useState<ListTargetInfo[]>([]); ;
    const [power] = useState<number>(2);
    const [maxPower] = useState<number>(5);
    const [handSize] = useState<number>(2);
    const [maxHandSize] = useState<number>(5);
    const [priority, setPriority] = useState<'hand' | 'power'>('hand');

    return (
        <TacticalDisplay
            cards={cards}
            slots={slots}
            targets={targets}
            onPause={() => console.log('pause please')}
            slotDeactivated={() => {}}
            slotFired={() => {}}
            power={power}
            maxPower={maxPower}
            handSize={handSize}
            maxHandSize={maxHandSize}
            playCard={() => {}}
            priority={priority}
            setPriority={setPriority}
        />
    );
};

import { useEffect, useState } from 'react';
import type { GameOutcome } from 'common-data/features/sectors/types/GamePhase';

/** How long the viewscreen stays on the space view once the ship is destroyed, so the crew can watch it explode. */
const defeatHoldDuration = 3000;

/**
 * Whether the viewscreen should show the outcome of the game yet. Defeat is held back for a moment, for the ship's explosion.
 * If the game was already over when the viewscreen appeared, there's no explosion to see, so the outcome shows straight away.
 */
export function useShowOutcome(isEnded: boolean, outcome: GameOutcome | null): boolean {
    const [holdElapsed, setHoldElapsed] = useState(isEnded);

    const isHolding = isEnded && outcome === 'defeat' && !holdElapsed;

    useEffect(() => {
        if (!isHolding) {
            return;
        }

        const timeout = setTimeout(() => setHoldElapsed(true), defeatHoldDuration);
        return () => clearTimeout(timeout);
    }, [isHolding]);

    return isEnded && !isHolding;
}

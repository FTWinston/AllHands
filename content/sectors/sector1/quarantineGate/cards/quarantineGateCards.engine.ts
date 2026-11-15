import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { defineEngineCards } from 'engine/content/EngineContent';
import { cards as sharedCards } from './quarantineGateCards.shared';
import type { GameState } from 'engine/state/GameState';
import type { Ship } from 'engine/state/Ship';

/** A Shutdown Key's play: the key is turned on its own station's system, for a while. Playing it again while it's turned starts its time over. */
function turnKey(role: CrewRoleName) {
    return (_gameState: GameState, ship: Ship) => {
        const tile = ship.engineerState.systems.find(candidate => candidate.system === role);
        return tile ? tile.addEffect('keyTurned') : false;
    };
}

export const cards = defineEngineCards(sharedCards, {
    shutdownKeyHelm: { play: turnKey('helm') },
    shutdownKeyScience: { play: turnKey('science') },
    shutdownKeyTactical: { play: turnKey('tactical') },
    shutdownKeyEngineer: { play: turnKey('engineer') },
    keyPower: {
        // Playing it again on a system that has it starts its time over, as adding an effect that's already there does.
        play: (_gameState, _ship, system) => system.addEffect('keyPower'),
    },
});

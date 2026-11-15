import { defineEngineCards } from 'engine/content/EngineContent';
import { cards as sharedCards } from './hullCards.shared';

export const cards = defineEngineCards(sharedCards, {
    // Hull cards are played as soon as they're drawn. HullState adds up their shield capacity.
    hullBare: {
        play: () => true,
    },
    hullShieldEmitter: {
        play: (_gameState, ship) => {
            ship.hullState.tuneShields('shieldReinforced');
            return true;
        },
    },
    hullVolatileEmitter: {
        play: (_gameState, ship) => {
            ship.hullState.tuneShields('shieldReinforced');
            return true;
        },
    },
    hullShieldTuningEnergy: {
        play: (_gameState, ship) => {
            ship.hullState.tuneShields('shieldTunedEnergy');
            return true;
        },
    },
    hullShieldTuningTorpedo: {
        play: (_gameState, ship) => {
            ship.hullState.tuneShields('shieldTunedTorpedo');
            return true;
        },
    },
});

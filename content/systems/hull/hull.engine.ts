import { defineEngineContent } from 'engine/content/EngineContent';
import { hullShared } from './hull.shared';

export const hullEngine = defineEngineContent({
    shared: hullShared,
    cards: {
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
    },
    effects: {
        // HullState switches the shields between these tunings as hull cards are played, and counts down any scrambling.
        shieldReinforced: {
            apply: (system) => {
                return system.system === 'hull';
            },
            remove: () => { },
        },
        shieldTunedEnergy: {
            apply: (system) => {
                return system.system === 'hull';
            },
            remove: () => { },
        },
        shieldTunedTorpedo: {
            apply: (system) => {
                return system.system === 'hull';
            },
            remove: () => { },
        },
    },
});

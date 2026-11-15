import { defineEngineCards } from 'engine/content/EngineContent';
import { cards as sharedCards } from './reactorCards.shared';

export const cards = defineEngineCards(sharedCards, {
    reactorPowerHull: {
        play: (_gameState, ship) => {
            ship.hullState.scheduledDraw.invoke();
            return true;
        },
        damaged: (_gameState, ship) => {
            ship.hullState.adjustEffectLevel('reducedPower', 1);
        },
        repaired: (_gameState, ship) => {
            ship.hullState.adjustEffectLevel('reducedPower', -1);
        },
    },
    reactorPowerReactor: {
        play: (_gameState, ship) => {
            ship.reactorState.scheduledDraw.invoke();
            return true;
        },
        damaged: (_gameState, ship) => {
            ship.reactorState.adjustEffectLevel('reducedPower', 1);
        },
        repaired: (_gameState, ship) => {
            ship.reactorState.adjustEffectLevel('reducedPower', -1);
        },
    },
    reactorPowerHelm: {
        play: (_gameState, ship) => {
            ship.helmState.scheduledDraw.invoke();
            return true;
        },
        damaged: (_gameState, ship) => {
            ship.helmState.adjustEffectLevel('reducedPower', 1);
        },
        repaired: (_gameState, ship) => {
            ship.helmState.adjustEffectLevel('reducedPower', -1);
        },
    },
    reactorPowerScience: {
        play: (_gameState, ship) => {
            ship.scienceState.scheduledDraw.invoke();
            return true;
        },
        damaged: (_gameState, ship) => {
            ship.scienceState.adjustEffectLevel('reducedPower', 1);
        },
        repaired: (_gameState, ship) => {
            ship.scienceState.adjustEffectLevel('reducedPower', -1);
        },
    },
    reactorPowerTactical: {
        play: (_gameState, ship) => {
            ship.tacticalState.scheduledDraw.invoke();
            return true;
        },
        damaged: (_gameState, ship) => {
            ship.tacticalState.adjustEffectLevel('reducedPower', 1);
        },
        repaired: (_gameState, ship) => {
            ship.tacticalState.adjustEffectLevel('reducedPower', -1);
        },
    },
    reactorPowerEngineer: {
        play: (_gameState, ship) => {
            ship.engineerState.scheduledDraw.invoke();
            return true;
        },
        damaged: (_gameState, ship) => {
            ship.engineerState.adjustEffectLevel('reducedPower', 1);
        },
        repaired: (_gameState, ship) => {
            ship.engineerState.adjustEffectLevel('reducedPower', -1);
        },
    },
});

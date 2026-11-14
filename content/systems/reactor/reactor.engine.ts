import { defineEngineContent } from 'engine/content/EngineContent';
import { reactorShared } from './reactor.shared';

export const reactorEngine = defineEngineContent({
    shared: reactorShared,
    cards: {
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
    },
    effects: {
        reducedPower: {
            apply: (system, level) => {
                system.adjustSystemPowerLevel(-level);
                return true;
            },
            remove: (system, removal, level) => {
                system.adjustSystemPowerLevel(level);

                if (removal === 'early') {
                    // If removed early, add this effect to a different system instead.
                    const ship = system.systemState.getShip();
                    const anotherSystem = ship.random.pick(ship.engineerState.systems.filter(s => s.system !== system.system));
                    anotherSystem.addEffect('reducedPower', level);
                }
            },
            onLevelChanged: (system, newLevel, oldLevel) => {
                system.adjustSystemPowerLevel(oldLevel - newLevel);
            },
        },
    },
});

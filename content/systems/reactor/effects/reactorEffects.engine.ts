import { defineEngineEffects } from 'engine/content/EngineContent';
import { effects as sharedEffects } from './reactorEffects.shared';

export const effects = defineEngineEffects(sharedEffects, {
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
});

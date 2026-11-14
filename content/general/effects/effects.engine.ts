import { defineEngineContent } from 'engine/content/EngineContent';
import { effectsShared } from './effects.shared';

export const effectsEngine = defineEngineContent({
    shared: effectsShared,
    effects: {
        shieldScrambled: {
            apply: (system) => {
                return system.system === 'hull';
            },
            remove: () => { },
        },
        damagedCard: {
            apply: () => {
                return true;
            },
            remove: () => {},
        },
        disruptGeneration: {
            apply: (system) => {
                // Stop scheduled draw events while this effect is active.
                // The level of this effect should be reduced by 1 each time a scheduled draw would have fired.
                system.systemState.scheduledDraw.addInterceptor('disruptGeneration', () => {
                    system.adjustEffectLevel('disruptGeneration', -1);
                    return true;
                });
                return true;
            },
            remove: (system) => {
                // When removed, allow scheduled draw events to fire again.
                system.systemState.scheduledDraw.removeInterceptor('disruptGeneration');
            },
        },
        feedback: {
            apply: (system, level) => {
                // Take level of damage every time this system does a scheduled draw.
                system.systemState.scheduledDraw.addListener('feedback', () => {
                    system.adjustSystemHealth(-level);
                });
                return true;
            },
            remove: (system) => {
                // When removed, allow scheduled draw events to fire again.
                system.systemState.scheduledDraw.removeListener('feedback');
            },
            onLevelChanged: (system, newLevel) => {
                // addAfterHandler replaces the old handler, so we can just call it again with the new level.
                system.systemState.scheduledDraw.addListener('feedback', () => {
                    system.adjustSystemHealth(-newLevel);
                });
            },
        },
        reactorBreach: {
            apply: () => {
                return true;
            },
            remove: (system, removal) => {
                // A breach that's still counting down as the encounter ends doesn't go off.
                if (removal !== 'cleared') {
                    system.systemState.getShip().destroy();
                }
            },
        },
    },
});

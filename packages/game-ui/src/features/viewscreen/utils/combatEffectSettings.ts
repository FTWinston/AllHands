import { createStoredToggle } from 'common-ui/utils/storedToggle';

const combatLabels = createStoredToggle('allhands.combatLabels', false);

/** Whether the viewscreen shows short text labels saying what's going on in a fight. Remembered between sessions. */
export const useCombatLabels = combatLabels.useValue;

export const setCombatLabels = combatLabels.set;

export const toggleCombatLabels = combatLabels.toggle;

/**
 * Until someone chooses for themselves, this follows the operating system's setting for reducing motion, as it is when the game loads.
 * That can be off without anyone meaning it to be, e.g. from choosing Windows' "best performance" option, hence the choice.
 */
const shakeAndFlashes = createStoredToggle('allhands.shakeAndFlashes', !window.matchMedia('(prefers-reduced-motion: reduce)').matches);

/** Whether a fight on the viewscreen shakes the view, and has sudden bright flashes. Remembered between sessions. */
export const useShakeAndFlashes = shakeAndFlashes.useValue;

export const toggleShakeAndFlashes = shakeAndFlashes.toggle;

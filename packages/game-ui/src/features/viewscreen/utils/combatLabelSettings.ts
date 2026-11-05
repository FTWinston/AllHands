import { createStoredToggle } from 'common-ui/utils/storedToggle';

const combatLabels = createStoredToggle('allhands.combatLabels', false);

/** Whether the viewscreen shows short text labels saying what's going on in a fight. Remembered between sessions. */
export const useCombatLabels = combatLabels.useValue;

export const setCombatLabels = combatLabels.set;

export const toggleCombatLabels = combatLabels.toggle;

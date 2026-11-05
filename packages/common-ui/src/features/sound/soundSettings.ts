import { createStoredToggle } from '../../utils/storedToggle';

const soundEnabled = createStoredToggle('allhands.soundEnabled', true);

/** Whether sound effects and vibration are enabled on this device. Remembered between sessions. */
export const isSoundEnabled = soundEnabled.get;

export const setSoundEnabled = soundEnabled.set;

export const toggleSoundEnabled = soundEnabled.toggle;

export const useSoundEnabled = soundEnabled.useValue;

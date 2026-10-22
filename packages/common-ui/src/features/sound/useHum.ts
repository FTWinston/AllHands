import { useEffect, useRef, useSyncExternalStore } from 'react';
import { getAudioOutput, isAudioRunning, subscribeToAudioState } from './audio';
import { useSoundEnabled } from './soundSettings';

/** Volume, and how bright the hum sounds, at each intensity. Index 0 is silent. */
const humLevels = [
    { volume: 0, filterFrequency: 0 },
    { volume: 0.04, filterFrequency: 600 },
    { volume: 0.08, filterFrequency: 900 },
];

export type HumIntensity = 0 | 1 | 2;

type Hum = {
    oscillator: OscillatorNode;
    filter: BiquadFilterNode;
    gain: GainNode;
};

const fadeSeconds = 0.4;

/**
 * Play a continuous low hum while intensity is above zero, fading smoothly between intensities.
 * The hum is a filtered sawtooth wobbling gently in volume, so a phone speaker can carry it even though it's low.
 */
export function useHum(intensity: HumIntensity) {
    const enabled = useSoundEnabled();
    const audioRunning = useSyncExternalStore(subscribeToAudioState, isAudioRunning);
    const hum = useRef<Hum | null>(null);

    const effectiveIntensity = enabled && audioRunning ? intensity : 0;

    useEffect(() => {
        const audio = getAudioOutput();
        const level = humLevels[effectiveIntensity];

        if (effectiveIntensity === 0 || !audio) {
            if (hum.current) {
                const { oscillator, gain } = hum.current;
                const now = gain.context.currentTime;
                gain.gain.cancelScheduledValues(now);
                gain.gain.setTargetAtTime(0, now, fadeSeconds / 3);
                oscillator.stop(now + fadeSeconds);
                hum.current = null;
            }
            return;
        }

        const { context, output } = audio;
        const now = context.currentTime;

        if (!hum.current) {
            const oscillator = context.createOscillator();
            oscillator.type = 'sawtooth';
            oscillator.frequency.value = 120;

            const filter = context.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = level.filterFrequency;

            const gain = context.createGain();
            gain.gain.value = 0;

            // A slow wobble in volume, to make it sound like machinery rather than a test tone.
            const wobble = context.createOscillator();
            wobble.frequency.value = 0.7;
            const wobbleDepth = context.createGain();
            wobbleDepth.gain.value = 0.25;
            const wobbleGain = context.createGain();
            wobble.connect(wobbleDepth).connect(wobbleGain.gain);

            oscillator.connect(filter).connect(gain).connect(wobbleGain).connect(output);
            oscillator.addEventListener('ended', () => {
                wobble.stop();
                wobbleGain.disconnect();
            });
            oscillator.start(now);
            wobble.start(now);

            hum.current = { oscillator, filter, gain };
        }

        const { filter, gain } = hum.current;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setTargetAtTime(level.volume, now, fadeSeconds / 3);
        filter.frequency.setTargetAtTime(level.filterFrequency, now, fadeSeconds / 3);
    }, [effectiveIntensity]);

    // Stop when unmounted.
    useEffect(() => () => {
        if (hum.current) {
            hum.current.oscillator.stop();
            hum.current = null;
        }
    }, []);
}

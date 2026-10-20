import { isSoundEnabled } from './soundSettings';

/*
 * Sounds are synthesized with the Web Audio API rather than played from files. Oscillators, filters and gain envelopes
 * all run natively on the audio thread, so a short beep costs a handful of nodes for a fraction of a second,
 * with nothing to download, decode or hold in memory.
 */

let context: AudioContext | null = null;
let output: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

/**
 * Browsers only let audio start in response to a user gesture, so create or resume the context on every tap or key press.
 * (Mobile browsers can also suspend it again, e.g. after a phone call.)
 */
function unlock() {
    if (!context) {
        context = new AudioContext({ latencyHint: 'interactive' });
        output = context.createGain();
        output.gain.value = 0.5;
        output.connect(context.destination);
        context.addEventListener('statechange', notifyAudioStateListeners);
    }

    if (context.state !== 'running') {
        void context.resume();
    }
}

if (typeof document !== 'undefined' && typeof AudioContext !== 'undefined') {
    document.addEventListener('pointerdown', unlock, { capture: true, passive: true });
    document.addEventListener('keydown', unlock, { capture: true, passive: true });
}

const audioStateListeners = new Set<() => void>();

function notifyAudioStateListeners() {
    for (const listener of audioStateListeners) {
        listener();
    }
}

/** Listen for audio starting or stopping, e.g. to start a continuous sound once the browser allows it. */
export function subscribeToAudioState(listener: () => void) {
    audioStateListeners.add(listener);
    return () => {
        audioStateListeners.delete(listener);
    };
}

export function isAudioRunning() {
    return context?.state === 'running';
}

/** The audio context and its output, if sound is enabled and the browser has let audio start. */
export function getAudioOutput(): { context: AudioContext; output: GainNode } | null {
    if (!context || !output || context.state !== 'running' || !isSoundEnabled()) {
        return null;
    }

    return { context, output };
}

type ToneOptions = {
    type?: OscillatorNode['type'];
    /** Starting frequency, in Hz. */
    frequency: number;
    /** If specified, the frequency slides exponentially to this by the end. */
    endFrequency?: number;
    /** Seconds after now to start. */
    delay?: number;
    /** Seconds, including the fade out. */
    duration: number;
    volume: number;
};

/** Play a single oscillator note with a quick attack and an exponential fade out. */
export function playTone(options: ToneOptions) {
    const audio = getAudioOutput();
    if (!audio) {
        return;
    }

    const { context, output } = audio;
    const start = context.currentTime + (options.delay ?? 0);
    const end = start + options.duration;

    const oscillator = context.createOscillator();
    oscillator.type = options.type ?? 'sine';
    oscillator.frequency.setValueAtTime(options.frequency, start);
    if (options.endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, end);
    }

    const gain = context.createGain();
    applyEnvelope(gain, start, end, options.volume);

    oscillator.connect(gain).connect(output);
    oscillator.start(start);
    oscillator.stop(end);
}

type NoiseOptions = {
    filterType?: BiquadFilterNode['type'];
    /** Starting filter frequency, in Hz. */
    filterFrequency: number;
    /** If specified, the filter frequency slides exponentially to this by the end. */
    endFilterFrequency?: number;
    /** Seconds after now to start. */
    delay?: number;
    /** Seconds, including the fade out. Up to 2 seconds. */
    duration: number;
    volume: number;
};

/** Play a burst of filtered white noise, for impacts, explosions and rushing air. */
export function playNoise(options: NoiseOptions) {
    const audio = getAudioOutput();
    if (!audio) {
        return;
    }

    const { context, output } = audio;
    const start = context.currentTime + (options.delay ?? 0);
    const end = start + options.duration;

    const source = context.createBufferSource();
    source.buffer = getNoiseBuffer(context);

    const filter = context.createBiquadFilter();
    filter.type = options.filterType ?? 'lowpass';
    filter.frequency.setValueAtTime(options.filterFrequency, start);
    if (options.endFilterFrequency) {
        filter.frequency.exponentialRampToValueAtTime(options.endFilterFrequency, end);
    }

    const gain = context.createGain();
    applyEnvelope(gain, start, end, options.volume);

    source.connect(filter).connect(gain).connect(output);
    source.start(start);
    source.stop(end);
}

function applyEnvelope(gain: GainNode, start: number, end: number, volume: number) {
    const attack = Math.min(0.01, (end - start) / 4);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
}

/** Two seconds of white noise, generated once and reused by every noise sound. */
function getNoiseBuffer(context: AudioContext) {
    if (!noiseBuffer) {
        noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    return noiseBuffer;
}

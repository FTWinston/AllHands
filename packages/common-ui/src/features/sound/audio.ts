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
        output = createOutput(context);
        context.addEventListener('statechange', notifyAudioStateListeners);
    }

    if (context.state !== 'running') {
        void context.resume();
    }
}

/**
 * Everything plays through a gentle low-pass filter and a short, dark echo, like an old console speaker in a metal room,
 * which takes the digital edge off the oscillators. A compressor lets explosions hit hard without clipping,
 * ducking anything quieter that's playing at the time.
 */
function createOutput(context: AudioContext) {
    const output = context.createGain();
    output.gain.value = 0.5;

    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -12;
    compressor.knee.value = 12;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.25;

    const speaker = context.createBiquadFilter();
    speaker.type = 'lowpass';
    speaker.frequency.value = 6000;
    speaker.Q.value = 0.5;
    output.connect(compressor).connect(speaker).connect(context.destination);

    const echo = context.createDelay(1);
    echo.delayTime.value = 0.11;
    const echoFilter = context.createBiquadFilter();
    echoFilter.type = 'lowpass';
    echoFilter.frequency.value = 2500;
    const feedback = context.createGain();
    feedback.gain.value = 0.3;
    const echoLevel = context.createGain();
    echoLevel.gain.value = 0.2;

    speaker.connect(echo).connect(echoFilter).connect(feedback).connect(echo);
    echoFilter.connect(echoLevel).connect(context.destination);

    return output;
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

/**
 * How a sound's volume changes over time. A gated sound holds its volume until it cuts off, like a console bleep;
 * a decaying sound fades away from the moment it starts, like an impact.
 */
type Envelope = 'gate' | 'decay';

type ToneOptions = {
    type?: OscillatorNode['type'];
    /** Starting frequency, in Hz. */
    frequency: number;
    /** If specified, the frequency slides exponentially to this by the end. */
    endFrequency?: number;
    /** Slides to further frequencies, each reached the given number of seconds after the tone starts. */
    bends?: { at: number; frequency: number }[];
    /**
     * Wobble the pitch up and down by this many cents, this many times a second.
     * A square wobble flips between two pitches, for a computer trill; a sine wobble is a smoother vibrato.
     */
    warble?: { rate: number; cents: number; shape?: OscillatorNode['type'] };
    /** Ring modulate by a sine wave at this frequency, in Hz, for a metallic, electrical edge. */
    ring?: number;
    envelope?: Envelope;
    /** Seconds to fade in. Defaults to near-instant. */
    attack?: number;
    /** Seconds after now to start. */
    delay?: number;
    /** Seconds, including the fade out. */
    duration: number;
    volume: number;
};

/** Play a single oscillator note, gated unless otherwise specified. */
export function playTone(options: ToneOptions) {
    const audio = getAudioOutput();
    if (!audio) {
        return;
    }

    const { context, output } = audio;
    const start = context.currentTime + (options.delay ?? 0);
    const end = start + options.duration;
    const sources: OscillatorNode[] = [];

    const oscillator = context.createOscillator();
    oscillator.type = options.type ?? 'sine';
    oscillator.frequency.setValueAtTime(options.frequency, start);
    for (const bend of options.bends ?? []) {
        oscillator.frequency.exponentialRampToValueAtTime(bend.frequency, start + bend.at);
    }
    if (options.endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(options.endFrequency, end);
    }
    sources.push(oscillator);

    if (options.warble) {
        const wobble = context.createOscillator();
        wobble.type = options.warble.shape ?? 'sine';
        wobble.frequency.value = options.warble.rate;
        const depth = context.createGain();
        depth.gain.value = options.warble.cents;
        wobble.connect(depth).connect(oscillator.detune);
        sources.push(wobble);
    }

    const gain = context.createGain();
    applyEnvelope(gain, start, end, options.volume, options.envelope ?? 'gate', options.attack);

    if (options.ring) {
        // A gain of zero, driven up and down by the modulator, multiplies the two signals together.
        const ring = context.createGain();
        ring.gain.value = 0;
        const modulator = context.createOscillator();
        modulator.frequency.value = options.ring;
        modulator.connect(ring.gain);
        sources.push(modulator);
        oscillator.connect(ring).connect(gain);
    } else {
        oscillator.connect(gain);
    }

    gain.connect(output);
    for (const source of sources) {
        source.start(start);
        source.stop(end);
    }
}

type NoiseOptions = {
    filterType?: BiquadFilterNode['type'];
    /** Starting filter frequency, in Hz. */
    filterFrequency: number;
    /** If specified, the filter frequency slides exponentially to this by the end. */
    endFilterFrequency?: number;
    /** Defaults to decaying. */
    envelope?: Envelope;
    /** Seconds to fade in. Defaults to near-instant. */
    attack?: number;
    /** Seconds after now to start. */
    delay?: number;
    /** Seconds, including the fade out. Up to 2 seconds. */
    duration: number;
    volume: number;
};

/** Play a burst of filtered white noise, for impacts, explosions, sparks and rushing air. */
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
    applyEnvelope(gain, start, end, options.volume, options.envelope ?? 'decay', options.attack);

    source.connect(filter).connect(gain).connect(output);
    source.start(start);
    source.stop(end);
}

/**
 * Pitches for computer chatter. Deliberately not from any musical scale,
 * so a run of them sounds like a machine at work rather than a tune.
 */
const chatterFrequencies = [587, 740, 905, 1110, 1310, 1570, 1830, 2210, 2640];

type ChatterOptions = {
    /** How many bleeps. */
    count: number;
    /** Seconds from the start of one bleep to the next. */
    step: number;
    /** Seconds after now to start. */
    delay?: number;
    volume: number;
};

/** Play a run of random bleeps and trills, like a bank of computers working something out. */
export function playChatter(options: ChatterOptions) {
    let previous = -1;

    for (let i = 0; i < options.count; i++) {
        // Never repeat a pitch straight away; it sounds like a stuck key.
        let index = Math.floor(Math.random() * (chatterFrequencies.length - 1));
        if (index >= previous) {
            index++;
        }
        previous = index;

        const isSquare = Math.random() < 0.3;

        playTone({
            type: isSquare ? 'square' : 'sine',
            frequency: chatterFrequencies[index],
            warble: Math.random() < 0.25 ? { rate: 25, cents: 300, shape: 'square' } : undefined,
            delay: (options.delay ?? 0) + i * options.step,
            duration: options.step * 0.8,
            // Square waves sound much louder than sine waves at the same volume.
            volume: isSquare ? options.volume * 0.4 : options.volume,
        });
    }
}

function applyEnvelope(gain: GainNode, start: number, end: number, volume: number, envelope: Envelope, attack = 0.005) {
    const length = end - start;
    const attackEnd = start + Math.min(attack, length / 2);

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, attackEnd);

    if (envelope === 'gate') {
        // Hold, then cut off quickly, but not so quickly that it clicks.
        const release = Math.min(0.02, (end - attackEnd) / 2);
        gain.gain.setValueAtTime(volume, end - release);
        gain.gain.linearRampToValueAtTime(0, end);
    } else {
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
    }
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

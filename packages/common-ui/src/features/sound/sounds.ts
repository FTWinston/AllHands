import { playChatter, playNoise, playTone } from './audio';

/*
 * The sounds are styled after the bridge of an early-1980s film starship, so the crew feel like they're flying a ship rather than
 * playing a video game. That means rounded sine bleeps and burbling computers at unmusical pitches, warm analog-synth sweeps
 * (sawtooth and square waves through a low-pass filter), deep engines, a whooping klaxon and a bosun's whistle,
 * and avoiding the plucked notes and musical intervals (chords, arpeggios, fanfares) that make a sound read as a game.
 */

/** Every sound effect in the game. Volumes are relative to each other; the output is mixed down by half. */
export const sounds = {
    /** A card arrives in your hand: one soft, dropping bloop. */
    cardDrawn() {
        playTone({ frequency: 920, endFrequency: 690, duration: 0.06, volume: 0.1 });
    },

    /** You play a card: a burble of console chatter, then a two-tone acknowledgement. */
    cardPlayed() {
        playChatter({ count: 3, step: 0.05, volume: 0.1 });
        playTone({ frequency: 1280, delay: 0.17, duration: 0.07, volume: 0.12 });
        playTone({ frequency: 915, delay: 0.25, duration: 0.1, volume: 0.12 });
    },

    /** You return a card to your deck: a falling bloop that sinks to a low bonk. Glum, but not an error. */
    cardDiscarded() {
        playTone({ frequency: 650, endFrequency: 330, duration: 0.14, volume: 0.15, warble: { rate: 9, cents: 40 } });
        playTone({ type: 'triangle', frequency: 260, endFrequency: 200, delay: 0.15, duration: 0.12, volume: 0.18 });
    },

    /** A card can't go where you dropped it: two low, dull buzzes. */
    refused() {
        playTone({ type: 'square', frequency: 150, duration: 0.1, volume: 0.12, filter: { frequency: 700 } });
        playTone({ type: 'square', frequency: 125, delay: 0.13, duration: 0.16, volume: 0.12, filter: { frequency: 600 } });
    },

    /** Your system gains power: a synth sweeping open as the machine winds up, then a bleep. */
    powerUp() {
        playTone({ type: 'sawtooth', frequency: 110, endFrequency: 220, duration: 0.5, volume: 0.12, filter: { frequency: 200, endFrequency: 1000, q: 0 } });
        playTone({ frequency: 1100, delay: 0.5, duration: 0.08, volume: 0.1 });
    },

    /** Your system loses power: the synth closing again as the machine winds down. */
    powerDown() {
        playTone({ type: 'sawtooth', frequency: 220, endFrequency: 70, duration: 0.6, volume: 0.12, filter: { frequency: 1000, endFrequency: 150, q: 0 } });
    },

    /** Science completes a scan: a soft sensor sweep, then two low bleeps. */
    scanComplete() {
        playTone({ type: 'triangle', frequency: 640, endFrequency: 1400, duration: 0.45, volume: 0.1, warble: { rate: 7, cents: 30 } });
        playTone({ frequency: 980, delay: 0.5, duration: 0.07, volume: 0.12 });
        playTone({ frequency: 980, delay: 0.62, duration: 0.07, volume: 0.12 });
    },

    /** A tactical weapon is charged and ready to fire: a rising synth tone that settles into a soft charged hum. */
    weaponReady() {
        playTone({ type: 'sawtooth', frequency: 220, endFrequency: 660, duration: 0.35, volume: 0.1, filter: { frequency: 300, endFrequency: 1200, q: 0 } });
        playTone({ type: 'triangle', frequency: 660, delay: 0.35, duration: 0.25, volume: 0.1, envelope: 'decay' });
    },

    /** Helm starts a manoeuvre: a long thruster burn over a low engine thrum. */
    maneuver() {
        playNoise({ filterType: 'bandpass', filterFrequency: 250, endFilterFrequency: 1000, attack: 0.25, duration: 1.6, volume: 0.35 });
        playTone({ type: 'sawtooth', frequency: 55, endFrequency: 85, envelope: 'decay', attack: 0.25, duration: 1.6, volume: 0.25, filter: { frequency: 300 }, warble: { rate: 8, cents: 30 } });
    },

    /** Someone takes a role in the lobby: a rising whoop and a bleep. */
    roleClaimed() {
        playTone({ frequency: 520, endFrequency: 1100, duration: 0.12, volume: 0.15 });
        playTone({ frequency: 1100, delay: 0.13, duration: 0.07, volume: 0.12 });
    },

    /** Someone gives up a role in the lobby: a falling whoop. */
    roleReleased() {
        playTone({ frequency: 1100, endFrequency: 520, duration: 0.15, volume: 0.12 });
    },

    /** Every role is claimed and the countdown to the game starting begins: two soft whoops, then the computers burbling into readiness. */
    countdownStarted() {
        for (const delay of [0, 0.5]) {
            playTone({ type: 'triangle', frequency: 330, endFrequency: 880, attack: 0.04, delay, duration: 0.4, volume: 0.12 });
        }
        playChatter({ count: 8, delay: 1, step: 0.06, volume: 0.08 });
    },

    /** A sector message comes in: the ship powering up, its computers coming online, then the bosun's whistle calls all hands. */
    messageReceived() {
        playTone({ type: 'sawtooth', frequency: 45, endFrequency: 180, attack: 0.4, duration: 1.5, volume: 0.17, filter: { frequency: 150, endFrequency: 700, q: 0 } });
        playNoise({ filterType: 'bandpass', filterFrequency: 200, endFilterFrequency: 1000, envelope: 'gate', attack: 0.6, duration: 1.2, volume: 0.1 });
        const chatter = { count: 18, delay: 0.8, step: 0.07 };
        playChatter({ ...chatter, volume: 0.09 });
        const chatterEnd = chatter.delay + chatter.count * chatter.step;
        bosunsWhistle(chatterEnd + 0.75, 1.2, 0.14);
    },

    /** The game is won: the computers settle, three soft all-clear bleeps, then systems swelling up to a warm, steady tone. */
    victory() {
        playChatter({ count: 5, step: 0.07, volume: 0.1 });
        for (const delay of [0.45, 0.65, 0.85]) {
            playTone({ frequency: 1280, delay, duration: 0.1, volume: 0.12 });
        }
        playTone({ type: 'sawtooth', frequency: 330, endFrequency: 660, delay: 1.05, attack: 0.4, duration: 1.6, volume: 0.12, envelope: 'decay', filter: { frequency: 400, endFrequency: 2500, q: 2 } });
    },

    /** The game is lost: sparks, and the ship's power failing as the synth closes down. */
    defeat() {
        crackle(0, 0.6, 6);
        playTone({ type: 'sawtooth', frequency: 220, endFrequency: 30, duration: 2.6, volume: 0.22, envelope: 'decay', filter: { frequency: 2400, endFrequency: 80, q: 5 }, warble: { rate: 4, cents: 60 } });
        playTone({ frequency: 1100, endFrequency: 250, delay: 0.2, duration: 1.5, volume: 0.06, warble: { rate: 6, cents: 80 } });
    },

    /** Your system takes damage: the console sparks, and a falling electrical buzz. */
    systemDamaged() {
        playTone({ type: 'sawtooth', frequency: 300, endFrequency: 55, duration: 0.5, volume: 0.2, envelope: 'decay', filter: { frequency: 3000, endFrequency: 300, q: 3 }, ring: 40 });
        crackle(0, 0.4, 5);
    },

    /** Your system is repaired: the synth sweeping back open, then a two-tone bleep. */
    systemRepaired() {
        playTone({ type: 'sawtooth', frequency: 165, endFrequency: 330, duration: 0.35, volume: 0.12, filter: { frequency: 300, endFrequency: 2600, q: 4 } });
        playTone({ frequency: 915, delay: 0.37, duration: 0.07, volume: 0.12 });
        playTone({ frequency: 1280, delay: 0.46, duration: 0.1, volume: 0.12 });
    },

    /** A phaser fires: a crackle into a thick, buzzing synth beam with a fast shimmer, over a low drone. Enemy fire is pitched lower than our own. */
    beamFired(isOwnShip: boolean) {
        const pitch = isOwnShip ? 1 : 0.7;
        playNoise({ filterType: 'highpass', filterFrequency: 3000 * pitch, duration: 0.08, volume: 0.35 });
        for (const detune of [1, 1.012]) {
            playTone({ type: 'sawtooth', frequency: 880 * pitch * detune, endFrequency: 700 * pitch * detune, attack: 0.01, duration: 0.65, volume: 0.13, filter: { frequency: 3200 * pitch, endFrequency: 1800 * pitch, q: 5 }, warble: { rate: 38, cents: 45 } });
        }
        playTone({ type: 'triangle', frequency: 165 * pitch, endFrequency: 130 * pitch, attack: 0.01, duration: 0.65, volume: 0.2, warble: { rate: 38, cents: 30 } });
    },

    /** A photon torpedo fires: a bright, falling synth swoosh trailing away, on top of a launch thump. Enemy fire is pitched lower than our own. */
    projectileFired(isOwnShip: boolean) {
        const pitch = isOwnShip ? 1 : 0.75;
        playTone({ type: 'sawtooth', frequency: 1600 * pitch, endFrequency: 260 * pitch, duration: 0.6, volume: 0.16, envelope: 'decay', filter: { frequency: 5000 * pitch, endFrequency: 500, q: 6 } });
        playTone({ frequency: 1300 * pitch, endFrequency: 320 * pitch, duration: 0.5, volume: 0.18, envelope: 'decay', warble: { rate: 10, cents: 60 } });
        playTone({ frequency: 150 * pitch, endFrequency: 42, duration: 0.3, volume: 0.6, envelope: 'decay' });
        playNoise({ filterFrequency: 2500 * pitch, endFilterFrequency: 150, duration: 0.5, volume: 0.4 });
    },

    /** A ship blows up: a sharp crack, a deep boom with a second blast after it, a groan of twisting metal, then debris crackling. */
    explosion() {
        playNoise({ filterType: 'highpass', filterFrequency: 2000, duration: 0.1, volume: 0.6 });
        playNoise({ filterFrequency: 3000, endFilterFrequency: 60, duration: 2, volume: 1 });
        playTone({ frequency: 90, endFrequency: 22, duration: 2, volume: 0.8, envelope: 'decay' });
        playNoise({ filterFrequency: 1200, endFilterFrequency: 80, delay: 0.35, duration: 1.4, volume: 0.7 });
        playTone({ type: 'sawtooth', frequency: 160, endFrequency: 45, delay: 0.3, duration: 1.3, volume: 0.15, envelope: 'decay', filter: { frequency: 900, endFrequency: 120 }, ring: 37 });
        crackle(0.2, 1.5, 10);
    },

    /** Another ship jumps to warp: a short rush as it gathers itself, then a pew as it goes. A smaller, quieter take on our own (see `warp`). */
    shipWarpedOut() {
        playNoise({ filterType: 'bandpass', filterFrequency: 300, endFilterFrequency: 3000, envelope: 'gate', attack: 0.3, duration: 0.5, volume: 0.2 });
        playTone({ frequency: 2000, endFrequency: 300, delay: 0.5, duration: 0.25, volume: 0.25, envelope: 'decay' });
        playNoise({ filterFrequency: 3500, endFilterFrequency: 300, delay: 0.5, duration: 0.2, volume: 0.2 });
    },

    /** Our ship is hit: a crack and a rumbling boom, with the hull groaning and consoles sparking. Bigger hits are louder and last longer. */
    shipHit(amount: number) {
        const volume = Math.min(1, 0.5 + amount * 0.1);
        const length = Math.min(1.4, 0.7 + amount * 0.1);
        playNoise({ filterType: 'highpass', filterFrequency: 2500, duration: 0.06, volume: volume * 0.5 });
        playNoise({ filterFrequency: 1500, endFilterFrequency: 80, duration: length, volume });
        playTone({ frequency: 110, endFrequency: 28, duration: length, volume: volume * 0.9, envelope: 'decay' });
        playTone({ type: 'sawtooth', frequency: 140, endFrequency: 55, delay: 0.1, duration: length * 0.8, volume: volume * 0.12, envelope: 'decay', filter: { frequency: 800, endFrequency: 150 }, ring: 33 });
        crackle(0.1, length * 0.6, Math.min(8, 2 + amount));
    },

    /** The sector map comes up: a soft sensor sweep, then the computers reading it out. */
    mapShown() {
        playTone({ type: 'triangle', frequency: 260, endFrequency: 1000, duration: 0.45, volume: 0.1, warble: { rate: 7, cents: 25 } });
        playChatter({ count: 3, delay: 0.5, step: 0.08, volume: 0.1 });
    },

    /** Warping between the map and an encounter, as the screen fades out: a swelling synth rush, then a pew as the ship jumps. */
    warp() {
        playNoise({ filterType: 'bandpass', filterFrequency: 150, endFilterFrequency: 3500, envelope: 'gate', attack: 0.6, duration: 1.3, volume: 0.45 });
        playTone({ type: 'sawtooth', frequency: 55, endFrequency: 440, attack: 0.5, duration: 1.3, volume: 0.14, filter: { frequency: 200, endFrequency: 4000, q: 6 } });
        playTone({ frequency: 2400, endFrequency: 280, delay: 1.3, duration: 0.3, volume: 0.45, envelope: 'decay' });
        playTone({ type: 'triangle', frequency: 1200, endFrequency: 140, delay: 1.3, duration: 0.3, volume: 0.3, envelope: 'decay' });
        playNoise({ filterFrequency: 4000, endFilterFrequency: 300, delay: 1.3, duration: 0.25, volume: 0.35 });
    },

    /** The hull is close to failing: three whoops of a klaxon, in time with the viewscreen's red alert flashes. */
    redAlert() {
        for (let i = 0; i < 3; i++) {
            klaxonWhoop(i * 1.1, 0.75, 0.15);
        }
    },

    /** The ship's computer prints text out, for about the given number of seconds: quiet, fast burbling. */
    textPrinting(seconds: number) {
        const step = 0.07;
        playChatter({ count: Math.max(1, Math.round(seconds / step)), step, volume: 0.025 });
    },

    /** Background computer chatter, played now and then while the bridge is busy. */
    bridgeChatter() {
        playChatter({ count: 3 + Math.floor(Math.random() * 5), step: 0.06 + Math.random() * 0.04, volume: 0.035 });
    },
};

/** One rising whoop of a red alert klaxon: a buzzy synth, opening up as it climbs. */
function klaxonWhoop(delay: number, duration: number, volume: number) {
    playTone({ type: 'sawtooth', frequency: 330, endFrequency: 880, attack: 0.04, delay, duration, volume, filter: { frequency: 900, endFrequency: 3500, q: 3 } });
    playTone({ type: 'square', frequency: 331, endFrequency: 882, attack: 0.04, delay, duration, volume: volume * 0.4, filter: { frequency: 1200, endFrequency: 2500 } });
}

/** The two notes of a bosun's call. */
const bosunsLow = 1976; // B6
const bosunsHigh = 2489; // E flat 7

/** A bosun's call: a breathy whistle on B6 that flicks quickly up to E flat 7, holds, and flicks back down again. */
function bosunsWhistle(delay: number, duration: number, volume: number) {
    const flick = 0.06;
    const up = duration * 0.22;
    const down = duration * 0.75;

    playTone({
        frequency: bosunsLow,
        bends: [
            { at: up, frequency: bosunsLow },
            { at: up + flick, frequency: bosunsHigh },
            { at: down, frequency: bosunsHigh },
            { at: down + flick, frequency: bosunsLow },
        ],
        attack: 0.03,
        delay,
        duration,
        volume,
    });

    // The breath through the whistle.
    playNoise({ filterType: 'bandpass', filterFrequency: bosunsLow, envelope: 'gate', attack: 0.03, delay, duration, volume: volume * 0.2 });
}

/** A few random sparks: short, sharp pops of high noise, spread over the given number of seconds. */
function crackle(delay: number, spread: number, count: number) {
    for (let i = 0; i < count; i++) {
        playNoise({
            filterType: 'highpass',
            filterFrequency: 2500 + Math.random() * 2500,
            delay: delay + Math.random() * spread,
            duration: 0.02 + Math.random() * 0.05,
            volume: 0.15 + Math.random() * 0.2,
        });
    }
}

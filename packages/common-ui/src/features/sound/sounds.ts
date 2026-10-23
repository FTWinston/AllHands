import { playChatter, playNoise, playTone } from './audio';

/*
 * The sounds are styled after the bridge of a 1960s TV starship, so the crew feel like they're flying a ship rather than
 * playing a video game. That means gated sine and square bleeps at unmusical pitches, computer chatter, warbling trills,
 * whistles and ring-modulated whines, and avoiding the plucked notes and musical intervals (chords, arpeggios, fanfares)
 * that make a sound read as a game.
 */

/** Every sound effect in the game. Volumes are relative to each other; the output is mixed down by half. */
export const sounds = {
    /** A card arrives in your hand: one soft, dropping bloop. */
    cardDrawn() {
        playTone({ frequency: 1250, endFrequency: 880, duration: 0.05, volume: 0.1 });
    },

    /** You play a card: a burst of console chatter, then a trilled acknowledgement. */
    cardPlayed() {
        playChatter({ count: 4, step: 0.045, volume: 0.12 });
        playTone({ frequency: 1900, delay: 0.19, duration: 0.14, volume: 0.12, warble: { rate: 28, cents: 250, shape: 'square' } });
    },

    /** You return a card to your deck: a wavering, falling bloop that sinks to a low bonk. Glum, but not an error. */
    cardDiscarded() {
        playTone({ frequency: 800, endFrequency: 400, duration: 0.14, volume: 0.15, warble: { rate: 14, cents: 60 } });
        playTone({ type: 'triangle', frequency: 300, endFrequency: 220, delay: 0.15, duration: 0.12, volume: 0.18 });
    },

    /** A card can't go where you dropped it: two low, grumbling buzzes. */
    refused() {
        playTone({ type: 'square', frequency: 196, duration: 0.09, volume: 0.1, ring: 70 });
        playTone({ type: 'square', frequency: 165, delay: 0.12, duration: 0.14, volume: 0.1, ring: 70 });
    },

    /** Your system gains power: a machine winding up, then a bleep. */
    powerUp() {
        playTone({ frequency: 180, endFrequency: 720, duration: 0.45, volume: 0.15, warble: { rate: 9, cents: 80 } });
        playTone({ frequency: 1570, delay: 0.45, duration: 0.07, volume: 0.1 });
    },

    /** Your system loses power: a machine winding down. */
    powerDown() {
        playTone({ frequency: 700, endFrequency: 140, duration: 0.5, volume: 0.15, warble: { rate: 7, cents: 80 } });
    },

    /** Science completes a scan: a high scanner warble, then two bleeps. */
    scanComplete() {
        playTone({ frequency: 2200, duration: 0.4, volume: 0.08, warble: { rate: 22, cents: 350, shape: 'square' } });
        playTone({ frequency: 1310, delay: 0.45, duration: 0.06, volume: 0.12 });
        playTone({ frequency: 1310, delay: 0.55, duration: 0.06, volume: 0.12 });
    },

    /** A tactical weapon is charged and ready to fire: a rising whine that locks into a trill. */
    weaponReady() {
        playTone({ type: 'triangle', frequency: 500, endFrequency: 1700, duration: 0.35, volume: 0.12, warble: { rate: 30, cents: 40 } });
        playTone({ frequency: 1700, delay: 0.35, duration: 0.18, volume: 0.12, warble: { rate: 24, cents: 120, shape: 'square' } });
    },

    /** Helm starts a manoeuvre: a long thruster burn over a low engine thrum, tailing away. */
    maneuver() {
        playNoise({ filterType: 'bandpass', filterFrequency: 300, endFilterFrequency: 1200, attack: 0.25, duration: 1.6, volume: 0.35 });
        playTone({ type: 'triangle', frequency: 70, endFrequency: 120, envelope: 'decay', attack: 0.25, duration: 1.6, volume: 0.3, warble: { rate: 11, cents: 50 } });
    },

    /** Someone takes a role in the lobby: a rising whoop and a bleep. */
    roleClaimed() {
        playTone({ frequency: 620, endFrequency: 1310, duration: 0.12, volume: 0.15 });
        playTone({ frequency: 1310, delay: 0.13, duration: 0.07, volume: 0.12 });
    },

    /** Someone gives up a role in the lobby: a falling whoop. */
    roleReleased() {
        playTone({ frequency: 1310, endFrequency: 620, duration: 0.15, volume: 0.12 });
    },

    /** The game starts: the ship powering up, its computers coming online, then the bosun's whistle calls all hands. */
    gameStarted() {
        playTone({ type: 'triangle', frequency: 60, endFrequency: 240, attack: 0.4, duration: 1.5, volume: 0.25, warble: { rate: 6, cents: 15 } });
        playNoise({ filterType: 'bandpass', filterFrequency: 200, endFilterFrequency: 1200, envelope: 'gate', attack: 0.6, duration: 1.2, volume: 0.12 });
        const chatter = { count: 20, delay: 0.8, step: 0.06 };
        playChatter({ ...chatter, volume: 0.1 });
        const chatterEnd = chatter.delay + chatter.count * chatter.step;
        bosunsWhistle(chatterEnd + 0.75, 1.2, 0.14);
    },

    /** The game is won: the computers settle, three trilled all-clear bleeps, then systems easing up to a steady tone. */
    victory() {
        playChatter({ count: 5, step: 0.06, volume: 0.1 });
        for (const delay of [0.4, 0.6, 0.8]) {
            playTone({ frequency: 1830, delay, duration: 0.12, volume: 0.12, warble: { rate: 25, cents: 300, shape: 'square' } });
        }
        playTone({ type: 'triangle', frequency: 400, endFrequency: 1310, delay: 1, attack: 0.3, duration: 1.4, volume: 0.15, envelope: 'decay', warble: { rate: 5, cents: 30 } });
    },

    /** The game is lost: sparks, and the ship's power failing. */
    defeat() {
        crackle(0, 0.6, 6);
        playTone({ type: 'triangle', frequency: 400, endFrequency: 40, duration: 2.5, volume: 0.25, envelope: 'decay', warble: { rate: 5, cents: 100 } });
        playTone({ frequency: 1310, endFrequency: 300, delay: 0.2, duration: 1.5, volume: 0.06, warble: { rate: 18, cents: 200, shape: 'square' } });
    },

    /** Your system takes damage: the console sparks, and a falling electrical buzz. */
    systemDamaged() {
        playTone({ type: 'sawtooth', frequency: 320, endFrequency: 60, duration: 0.45, volume: 0.2, ring: 45, envelope: 'decay' });
        crackle(0, 0.4, 5);
    },

    /** Your system is repaired: a machine winding back up, then a trilled bleep. */
    systemRepaired() {
        playTone({ frequency: 500, endFrequency: 1400, duration: 0.3, volume: 0.15, warble: { rate: 16, cents: 60 } });
        playTone({ frequency: 1830, delay: 0.32, duration: 0.15, volume: 0.12, warble: { rate: 25, cents: 300, shape: 'square' } });
    },

    /** A beam weapon fires: a crackling zap into a loud, metallic, wavering whine over a low drone. Enemy fire is pitched lower than our own. */
    beamFired(isOwnShip: boolean) {
        const pitch = isOwnShip ? 1 : 0.7;
        playNoise({ filterType: 'highpass', filterFrequency: 3000 * pitch, duration: 0.08, volume: 0.4 });
        playTone({ type: 'sawtooth', frequency: 1400 * pitch, endFrequency: 950 * pitch, attack: 0.01, duration: 0.6, volume: 0.18, ring: 310 * pitch, warble: { rate: 35, cents: 90 } });
        playTone({ frequency: 2800 * pitch, endFrequency: 1900 * pitch, attack: 0.01, duration: 0.6, volume: 0.08, warble: { rate: 50, cents: 60 } });
        playTone({ type: 'triangle', frequency: 220 * pitch, endFrequency: 160 * pitch, attack: 0.01, duration: 0.6, volume: 0.2, warble: { rate: 35, cents: 40 } });
    },

    /** A projectile weapon fires: a big wavering, falling bloop on top of a launch thump. Enemy fire is pitched lower than our own. */
    projectileFired(isOwnShip: boolean) {
        const pitch = isOwnShip ? 1 : 0.75;
        playTone({ frequency: 1300 * pitch, endFrequency: 380 * pitch, duration: 0.4, volume: 0.3, warble: { rate: 14, cents: 80 } });
        playTone({ type: 'triangle', frequency: 650 * pitch, endFrequency: 190 * pitch, duration: 0.4, volume: 0.2, warble: { rate: 14, cents: 80 } });
        playTone({ frequency: 160 * pitch, endFrequency: 45, duration: 0.3, volume: 0.6, envelope: 'decay' });
        playNoise({ filterFrequency: 1500 * pitch, endFilterFrequency: 150, duration: 0.35, volume: 0.5 });
    },

    /** A ship blows up: a sharp crack, a deep boom with a second blast after it, a groan of twisting metal, then debris crackling. */
    explosion() {
        playNoise({ filterType: 'highpass', filterFrequency: 2000, duration: 0.1, volume: 0.6 });
        playNoise({ filterFrequency: 3000, endFilterFrequency: 60, duration: 2, volume: 1 });
        playTone({ frequency: 100, endFrequency: 25, duration: 1.8, volume: 0.8, envelope: 'decay' });
        playNoise({ filterFrequency: 1200, endFilterFrequency: 80, delay: 0.35, duration: 1.4, volume: 0.7 });
        playTone({ type: 'sawtooth', frequency: 180, endFrequency: 50, delay: 0.3, duration: 1.2, volume: 0.15, ring: 37, envelope: 'decay' });
        crackle(0.2, 1.5, 10);
    },

    /** Our ship is hit: a crack and a rumbling boom, with the hull groaning and consoles sparking. Bigger hits are louder and last longer. */
    shipHit(amount: number) {
        const volume = Math.min(1, 0.5 + amount * 0.1);
        const length = Math.min(1.4, 0.7 + amount * 0.1);
        playNoise({ filterType: 'highpass', filterFrequency: 2500, duration: 0.06, volume: volume * 0.5 });
        playNoise({ filterFrequency: 1500, endFilterFrequency: 80, duration: length, volume });
        playTone({ frequency: 120, endFrequency: 30, duration: length, volume: volume * 0.9, envelope: 'decay' });
        playTone({ type: 'sawtooth', frequency: 150, endFrequency: 60, delay: 0.1, duration: length * 0.8, volume: volume * 0.12, ring: 33, envelope: 'decay' });
        crackle(0.1, length * 0.6, Math.min(8, 2 + amount));
    },

    /** The sector map comes up: a sensor sweep, then the computers reading it out. */
    mapShown() {
        playTone({ frequency: 300, endFrequency: 1200, duration: 0.4, volume: 0.1, warble: { rate: 20, cents: 30 } });
        playChatter({ count: 3, delay: 0.45, step: 0.07, volume: 0.1 });
    },

    /** Warping between the map and an encounter, as the screen fades out: a swelling, rising rush, then a loud pew as the ship jumps. */
    warp() {
        playNoise({ filterType: 'bandpass', filterFrequency: 150, endFilterFrequency: 4000, envelope: 'gate', attack: 0.6, duration: 1.3, volume: 0.5 });
        playTone({ type: 'triangle', frequency: 80, endFrequency: 900, attack: 0.5, duration: 1.3, volume: 0.15, warble: { rate: 5, cents: 40 } });
        playTone({ frequency: 2400, endFrequency: 280, delay: 1.3, duration: 0.3, volume: 0.45, envelope: 'decay' });
        playTone({ type: 'triangle', frequency: 1200, endFrequency: 140, delay: 1.3, duration: 0.3, volume: 0.3, envelope: 'decay' });
        playNoise({ filterFrequency: 4000, endFilterFrequency: 300, delay: 1.3, duration: 0.25, volume: 0.35 });
    },

    /** A sector message comes in: a quick bosun's whistle, as before a shipwide announcement. */
    messageReceived() {
        bosunsWhistle(0, 0.6, 0.12);
    },

    /** Background computer chatter, played now and then while the bridge is busy. */
    bridgeChatter() {
        playChatter({ count: 3 + Math.floor(Math.random() * 5), step: 0.05 + Math.random() * 0.04, volume: 0.035 });
    },
};

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

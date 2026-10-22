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

    /** You return a card to your deck: a wavering, falling bloop. */
    cardDiscarded() {
        playTone({ frequency: 950, endFrequency: 480, duration: 0.16, volume: 0.15, warble: { rate: 14, cents: 60 } });
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

    /** Helm starts a manoeuvre: a thruster whoosh over a low engine thrum. */
    maneuver() {
        playNoise({ filterType: 'bandpass', filterFrequency: 300, endFilterFrequency: 1200, attack: 0.1, duration: 0.6, volume: 0.3 });
        playTone({ type: 'triangle', frequency: 70, endFrequency: 110, attack: 0.1, duration: 0.6, volume: 0.25, warble: { rate: 11, cents: 50 } });
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

    /** The game starts: the ship powering up, and its computers coming online. */
    gameStarted() {
        playTone({ type: 'triangle', frequency: 60, endFrequency: 240, attack: 0.4, duration: 1.2, volume: 0.25, warble: { rate: 6, cents: 50 } });
        playNoise({ filterType: 'bandpass', filterFrequency: 200, endFilterFrequency: 1200, envelope: 'gate', attack: 0.6, duration: 1, volume: 0.12 });
        playChatter({ count: 8, delay: 0.8, step: 0.06, volume: 0.1 });
    },

    /** The game is won: the computers settle, and the bosun's whistle stands the crew down. */
    victory() {
        playChatter({ count: 5, step: 0.06, volume: 0.1 });
        bosunsWhistle(0.4, 1.4, 0.15);
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

    /** A beam weapon fires: a metallic, wavering whine. Enemy fire is pitched lower than our own. */
    beamFired(isOwnShip: boolean) {
        const pitch = isOwnShip ? 1 : 0.7;
        playTone({ type: 'sawtooth', frequency: 1400 * pitch, endFrequency: 1000 * pitch, attack: 0.02, duration: 0.45, volume: 0.08, ring: 310 * pitch, warble: { rate: 35, cents: 90 } });
        playTone({ frequency: 2800 * pitch, endFrequency: 2000 * pitch, attack: 0.02, duration: 0.45, volume: 0.04, warble: { rate: 50, cents: 60 } });
    },

    /** A projectile weapon fires: a wavering, falling launch with a thump. Enemy fire is pitched lower than our own. */
    projectileFired(isOwnShip: boolean) {
        const pitch = isOwnShip ? 1 : 0.75;
        playTone({ frequency: 1400 * pitch, endFrequency: 250 * pitch, duration: 0.55, volume: 0.2, envelope: 'decay', warble: { rate: 40, cents: 150 } });
        playNoise({ filterFrequency: 1200 * pitch, endFilterFrequency: 200, duration: 0.3, volume: 0.25 });
    },

    /** A ship blows up: a deep boom, then debris crackling. */
    explosion() {
        playNoise({ filterFrequency: 2000, endFilterFrequency: 80, duration: 1.6, volume: 0.9 });
        playTone({ frequency: 90, endFrequency: 30, duration: 1.2, volume: 0.6, envelope: 'decay' });
        crackle(0.2, 0.8, 6);
    },

    /** Our ship is hit: a rumbling boom. Bigger hits are louder, and spark too. */
    shipHit(amount: number) {
        const volume = Math.min(1, 0.4 + amount * 0.1);
        playNoise({ filterFrequency: 900, endFilterFrequency: 100, duration: 0.5, volume });
        playTone({ frequency: 110, endFrequency: 40, duration: 0.45, volume: volume * 0.8, envelope: 'decay' });
        if (amount > 0) {
            crackle(0.1, 0.4, Math.min(6, 1 + amount));
        }
    },

    /** The sector map comes up: a sensor sweep, then the computers reading it out. */
    mapShown() {
        playTone({ frequency: 300, endFrequency: 1200, duration: 0.4, volume: 0.1, warble: { rate: 20, cents: 30 } });
        playChatter({ count: 3, delay: 0.45, step: 0.07, volume: 0.1 });
    },

    /** Warping between the map and an encounter, as the screen fades out: a swelling, rising rush. */
    warp() {
        playNoise({ filterType: 'bandpass', filterFrequency: 150, endFilterFrequency: 4000, envelope: 'gate', attack: 0.6, duration: 1.4, volume: 0.5 });
        playTone({ type: 'triangle', frequency: 80, endFrequency: 900, attack: 0.5, duration: 1.3, volume: 0.15, warble: { rate: 5, cents: 40 } });
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

/** A whistle that swoops up, holds with a little vibrato, then falls away. */
function bosunsWhistle(delay: number, duration: number, volume: number) {
    playTone({
        frequency: 700,
        bends: [
            { at: 0.15, frequency: 1500 },
            { at: duration - 0.2, frequency: 1500 },
        ],
        endFrequency: 1050,
        warble: { rate: 7, cents: 25 },
        attack: 0.05,
        delay,
        duration,
        volume,
    });
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

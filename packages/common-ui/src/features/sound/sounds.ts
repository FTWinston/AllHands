import { playNoise, playTone } from './audio';

/** Every sound effect in the game. Volumes are relative to each other; the output is mixed down by half. */
export const sounds = {
    /** A card arrives in your hand: one quiet blip. */
    cardDrawn() {
        playTone({ frequency: 1320, duration: 0.07, volume: 0.15 });
    },

    /** You play a card: a quick rising trill. */
    cardPlayed() {
        playTone({ type: 'triangle', frequency: 880, duration: 0.06, volume: 0.3 });
        playTone({ type: 'triangle', frequency: 1175, delay: 0.05, duration: 0.06, volume: 0.3 });
        playTone({ type: 'triangle', frequency: 1568, delay: 0.1, duration: 0.09, volume: 0.3 });
    },

    /** You return a card to your deck: a soft falling blip. */
    cardDiscarded() {
        playTone({ type: 'triangle', frequency: 700, endFrequency: 440, duration: 0.1, volume: 0.2 });
    },

    /** A card can't go where you dropped it: a low double buzz. */
    refused() {
        playTone({ type: 'square', frequency: 180, duration: 0.08, volume: 0.15 });
        playTone({ type: 'square', frequency: 150, delay: 0.1, duration: 0.12, volume: 0.15 });
    },

    /** Your system gains power: a short rising sweep. */
    powerUp() {
        playTone({ type: 'triangle', frequency: 300, endFrequency: 900, duration: 0.25, volume: 0.2 });
    },

    /** Your system loses power: a short falling sweep. */
    powerDown() {
        playTone({ type: 'triangle', frequency: 800, endFrequency: 200, duration: 0.3, volume: 0.2 });
    },

    /** Science completes a scan: a sonar ping with a fading echo. */
    scanComplete() {
        playTone({ frequency: 1800, duration: 0.6, volume: 0.25 });
        playTone({ frequency: 1800, delay: 0.35, duration: 0.5, volume: 0.07 });
    },

    /** A tactical weapon is charged and ready to fire: two bright notes. */
    weaponReady() {
        playTone({ type: 'triangle', frequency: 1047, duration: 0.08, volume: 0.25 });
        playTone({ type: 'triangle', frequency: 2093, delay: 0.08, duration: 0.18, volume: 0.25 });
    },

    /** Helm starts a manoeuvre: a short thruster whoosh. */
    maneuver() {
        playNoise({ filterType: 'bandpass', filterFrequency: 400, endFilterFrequency: 1800, duration: 0.5, volume: 0.4 });
    },

    /** Someone takes a role in the lobby. */
    roleClaimed() {
        playTone({ frequency: 990, duration: 0.07, volume: 0.2 });
        playTone({ frequency: 1320, delay: 0.07, duration: 0.1, volume: 0.2 });
    },

    /** Someone gives up a role in the lobby. */
    roleReleased() {
        playTone({ frequency: 1320, duration: 0.07, volume: 0.15 });
        playTone({ frequency: 990, delay: 0.07, duration: 0.1, volume: 0.15 });
    },

    /** The game starts: a bright major chord. */
    gameStarted() {
        for (const frequency of [523, 659, 784, 1047]) {
            playTone({ type: 'triangle', frequency, duration: 0.9, volume: 0.15 });
        }
    },

    /** The game is won: a rising fanfare. */
    victory() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((frequency, i) => {
            playTone({ type: 'triangle', frequency, delay: i * 0.15, duration: i === notes.length - 1 ? 1.2 : 0.2, volume: 0.25 });
        });
    },

    /** The game is lost: a slow falling minor phrase. */
    defeat() {
        const notes = [392, 311, 262, 196];
        notes.forEach((frequency, i) => {
            playTone({ type: 'sawtooth', frequency, delay: i * 0.35, duration: i === notes.length - 1 ? 1.5 : 0.4, volume: 0.12 });
        });
    },

    /** Your system takes damage: a downward electrical crunch. */
    systemDamaged() {
        playTone({ type: 'sawtooth', frequency: 220, endFrequency: 55, duration: 0.4, volume: 0.35 });
        playNoise({ filterFrequency: 2500, endFilterFrequency: 200, duration: 0.35, volume: 0.5 });
    },

    /** Your system is repaired: a bright rising chime. */
    systemRepaired() {
        playTone({ frequency: 660, duration: 0.12, volume: 0.25 });
        playTone({ frequency: 880, delay: 0.09, duration: 0.12, volume: 0.25 });
        playTone({ frequency: 1320, delay: 0.18, duration: 0.3, volume: 0.25 });
        playTone({ type: 'triangle', frequency: 2640, delay: 0.18, duration: 0.3, volume: 0.06 });
    },

    /** A beam weapon fires. Enemy fire is pitched lower than our own. */
    beamFired(isOwnShip: boolean) {
        const pitch = isOwnShip ? 1 : 0.7;
        playTone({ type: 'sawtooth', frequency: 1600 * pitch, endFrequency: 250 * pitch, duration: 0.22, volume: 0.15 });
        playTone({ type: 'square', frequency: 1200 * pitch, endFrequency: 300 * pitch, duration: 0.18, volume: 0.06 });
    },

    /** A projectile weapon fires: a deep launch thump. Enemy fire is pitched lower than our own. */
    projectileFired(isOwnShip: boolean) {
        const pitch = isOwnShip ? 1 : 0.75;
        playTone({ frequency: 260 * pitch, endFrequency: 60 * pitch, duration: 0.3, volume: 0.5 });
        playNoise({ filterFrequency: 1500 * pitch, endFilterFrequency: 300, duration: 0.25, volume: 0.35 });
    },

    /** A ship blows up. */
    explosion() {
        playNoise({ filterFrequency: 2000, endFilterFrequency: 80, duration: 1.6, volume: 0.9 });
        playTone({ frequency: 90, endFrequency: 30, duration: 1.2, volume: 0.6 });
    },

    /** Our ship is hit. Bigger hits are louder. */
    shipHit(amount: number) {
        const volume = Math.min(1, 0.4 + amount * 0.1);
        playNoise({ filterFrequency: 900, endFilterFrequency: 100, duration: 0.5, volume });
        playTone({ frequency: 110, endFrequency: 40, duration: 0.45, volume: volume * 0.8 });
    },

    /** The sector map comes up: a sensor sweep and two blips. */
    mapShown() {
        playTone({ frequency: 300, endFrequency: 1200, duration: 0.4, volume: 0.12 });
        playTone({ frequency: 1500, delay: 0.45, duration: 0.08, volume: 0.15 });
        playTone({ frequency: 1500, delay: 0.6, duration: 0.08, volume: 0.15 });
    },

    /** Setting off from the map for the chosen destination: a rising warp whoosh. */
    warp() {
        playNoise({ filterType: 'bandpass', filterFrequency: 150, endFilterFrequency: 4000, duration: 1.4, volume: 0.6 });
        playTone({ frequency: 80, endFrequency: 900, duration: 1.3, volume: 0.15 });
    },

    /** A sector message comes in: an incoming-hail double beep. */
    messageReceived() {
        playTone({ type: 'triangle', frequency: 1000, duration: 0.1, volume: 0.25 });
        playTone({ type: 'triangle', frequency: 1500, delay: 0.14, duration: 0.14, volume: 0.25 });
    },
};

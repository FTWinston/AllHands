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
